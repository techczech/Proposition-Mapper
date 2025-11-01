import { GoogleGenAI, Type } from "@google/genai";
import type { GraphData, Term, Relationship } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to generate unique IDs, as Gemini doesn't provide them
export const generateId = (label: string): string => {
  return label.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]+/g, '');
};

export const extractConceptsAndRelationships = async (text: string, propositionCount: number): Promise<GraphData> => {
  // Stage 1: Identify key terms and their definitions
  const termExtractionResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Analyze the following text and extract the key terms. For each term, provide a short definition based on how it is used in the text. The text is:\n\n---\n\n${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          terms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: {
                  type: Type.STRING,
                  description: "A key term or concept from the text.",
                },
                definition: {
                  type: Type.STRING,
                  description: "A concise definition of the term based on its context in the text.",
                },
              },
              required: ["term", "definition"],
            },
          },
        },
        required: ["terms"],
      },
    },
  });

  const termResult = JSON.parse(termExtractionResponse.text);
  const rawTerms: { term: string; definition: string }[] = termResult.terms || [];

  if (rawTerms.length === 0) {
    return { terms: [], relationships: [] };
  }

  const terms: Term[] = rawTerms.map(t => ({
    id: generateId(t.term),
    label: t.term,
    definition: t.definition
  }));

  const termLabels = terms.map(t => t.label);

  // Stage 2: Extract relationships between the identified terms
  const relationshipExtractionResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Based on the following text, identify the relationships between the provided key terms. Format each relationship as a 'subject-predicate-object' triple. The subject and object must be one of the provided key terms. Please generate approximately ${propositionCount} of the most significant relationships.\n\nText:\n---\n${text}\n\nKey Terms:\n---\n${termLabels.join(', ')}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          relationships: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                subject: {
                  type: Type.STRING,
                  description: "The subject of the relationship, must be one of the key terms.",
                },
                predicate: {
                  type: Type.STRING,
                  description: "The predicate describing the relationship.",
                },
                object: {
                  type: Type.STRING,
                  description: "The object of the relationship, must be one of the key terms.",
                },
              },
              required: ["subject", "predicate", "object"],
            },
          },
        },
        required: ["relationships"],
      },
    },
  });
  
  const relationshipResult = JSON.parse(relationshipExtractionResponse.text);
  const rawRelationships: { subject: string; predicate: string; object: string }[] = relationshipResult.relationships || [];

  const termMap = new Map(terms.map(t => [t.label.toLowerCase(), t.id]));

  const relationships: Relationship[] = rawRelationships
    .map(r => {
      const sourceId = termMap.get(r.subject.toLowerCase());
      const targetId = termMap.get(r.object.toLowerCase());
      if (sourceId && targetId) {
        return {
          source: sourceId,
          target: targetId,
          label: r.predicate,
        };
      }
      return null;
    })
    .filter((r): r is Relationship => r !== null);

  return { terms, relationships };
};


export const extractMoreRelationships = async (text: string, terms: Term[], existingRelationships: Relationship[]): Promise<Relationship[]> => {
    const termLabels = terms.map(t => t.label);
    const termIdToLabelMap = new Map(terms.map(t => [t.id, t.label]));
    
    const existingRelationshipStrings = existingRelationships.map(r => {
        const sourceLabel = termIdToLabelMap.get(r.source) || r.source;
        const targetLabel = termIdToLabelMap.get(r.target) || r.target;
        return `${sourceLabel} - ${r.label} - ${targetLabel}`;
    }).join('\n');

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Based on the following text, identify 5-10 additional relationships between the provided key terms. The subject and object must be one of the provided key terms. IMPORTANT: Do not repeat any of the relationships already provided below.\n\nText:\n---\n${text}\n\nKey Terms:\n---\n${termLabels.join(', ')}\n\nExisting Relationships to Avoid:\n---\n${existingRelationshipStrings}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              relationships: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    subject: { type: Type.STRING },
                    predicate: { type: Type.STRING },
                    object: { type: Type.STRING },
                  },
                  required: ["subject", "predicate", "object"],
                },
              },
            },
            required: ["relationships"],
          },
        },
    });

    const result = JSON.parse(response.text);
    const rawRelationships: { subject: string; predicate: string; object: string }[] = result.relationships || [];

    const termLabelToIdMap = new Map(terms.map(t => [t.label.toLowerCase(), t.id]));

    const newRelationships: Relationship[] = rawRelationships
        .map(r => {
            const sourceId = termLabelToIdMap.get(r.subject.toLowerCase());
            const targetId = termLabelToIdMap.get(r.object.toLowerCase());
            if (sourceId && targetId) {
                return {
                    source: sourceId,
                    target: targetId,
                    label: r.predicate,
                };
            }
            return null;
        })
        .filter((r): r is Relationship => r !== null);

    return newRelationships;
};