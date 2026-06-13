function bump(map, key, amount = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + amount);
}

function edgeKey(source, target) {
  return [source, target].sort((a, b) => a.localeCompare(b)).join('::');
}

export const SkillGraphBuilder = {
  build(memory = {}) {
    const nodes = new Map();
    const edges = new Map();
    const exchanges = memory.exchanges || [];

    for (const exchange of exchanges) {
      const extraction = exchange.extraction || {};
      const labels = [
        ...(extraction.skills || []),
        ...(extraction.technologies || []),
        ...(extraction.projectNames || []),
      ];

      for (const label of labels) bump(nodes, label, 1 + Number(extraction.confidence || 0));
      for (let i = 0; i < labels.length; i += 1) {
        for (let j = i + 1; j < labels.length; j += 1) {
          const key = edgeKey(labels[i], labels[j]);
          const existing = edges.get(key) || { source: labels[i], target: labels[j], weight: 0 };
          existing.weight += Number(extraction.confidence || 0.5);
          edges.set(key, existing);
        }
      }
    }

    return {
      nodes: [...nodes.entries()]
        .map(([label, weight]) => ({ label, weight: Number(weight.toFixed(2)) }))
        .sort((a, b) => b.weight - a.weight),
      edges: [...edges.values()]
        .map((edge) => ({ ...edge, weight: Number(edge.weight.toFixed(2)) }))
        .sort((a, b) => b.weight - a.weight),
    };
  },
};
