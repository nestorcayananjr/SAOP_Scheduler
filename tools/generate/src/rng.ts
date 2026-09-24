export function makeRng (seed: number): () => number {
    return function() {
      seed |= 0; seed = seed + 0x6d2b79f5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: () => number, items: T[]): T{
  return items[randInt(rng, 0, items.length -1 )]
}

export function shuffle<T>(rng: () => number, items: T[]) {
  const shuffledItems = structuredClone(items)
    for (let i = shuffledItems.length - 1; i >= 1; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
    }
    return shuffledItems;
}


export function weightedSampleWithoutReplacement<T>(rng: () => number, items: T[], weights: number[], k: number): T[]{
  if (k > items.length) throw new Error("K value must be less than the number of items")
  
  let counter = 0;
  const sample = [];
  let currItems = structuredClone(items);
  let currWeights = structuredClone(weights);

  while (counter < k){
    const total = currWeights.reduce((sum, w) => sum + w, 0);
    const r = rng() * total;
    let running = 0;
      for (let i = 0; i < currWeights.length; i++) {
        running += currWeights[i];
        if (running >= r){
          sample.push(currItems[i]);
          currItems = [...currItems.slice(0, i), ...currItems.slice(i + 1, currItems.length)]
          currWeights = [...currWeights.slice(0, i), ...currWeights.slice(i + 1, currWeights.length)]
          break;
        }
      }
    counter++;
  }

  return sample;
}