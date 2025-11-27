import { Pinecone } from "@pinecone-database/pinecone";
import { PINECONE_TOP_K, PINECONE_INDEX_NAME } from "@/config";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is not set");
}

// ---- 1. Create Pinecone client + index ----
export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

// ---- 2. Search function used by your RAG tool ----
//
// It takes a natural-language query and returns a big string
// of review snippets, wrapped in <results> ... </results>
// so the SYSTEM_PROMPT can inject it.

export async function searchPinecone(query: string): Promise<string> {
  // We use the same namespace that you used in Colab: "default"
  const ns = pineconeIndex.namespace("default");

  // Call the Records API: searchRecords
  const results = await ns.searchRecords({
    query: {
      inputs: {
        text: query,
      },
      topK: PINECONE_TOP_K,
    },
    // These are the fields you actually stored from Colab
    fields: [
      "text",
      "chunk_text",
      "asin",
      "parent_asin",
      "which_product",
      "rating",
      "verified_purchase",
      "helpful_vote",
      "timestamp",
    ],
  });

  const hits = results.result?.hits ?? [];

  if (hits.length === 0) {
    return "<results>NO_RAG_RESULTS</results>";
  }

  // Build human-readable snippets for the model
  const snippets = hits.map((hit, idx) => {
    const f = hit.fields as any;

    const which = f.which_product ?? "UNKNOWN_PRODUCT";
    const asin = f.asin ?? "UNKNOWN_ASIN";
    const rating =
      typeof f.rating === "number" ? f.rating.toFixed(1) : String(f.rating ?? "NA");
    const ts = f.timestamp ?? "";
    const verified = f.verified_purchase ? "verified" : "unverified";
    const helpful = f.helpful_vote ?? 0;

    const rawText = (f.chunk_text || f.text || "").toString();
    const text = rawText.replace(/\s+/g, " ").slice(0, 400); // limit length

    return [
      `#${idx + 1} [${which} | ASIN ${asin} | ${rating}★ | ${verified} | helpful=${helpful} | ts=${ts}]`,
      text,
    ].join("\n");
  });

  const joined = snippets.join("\n\n---\n\n");

  // Wrap in a tag so the SYSTEM_PROMPT can say:
  // "Between <results>...</results> you have review snippets"
  return `<results>\n${joined}\n</results>`;
}
