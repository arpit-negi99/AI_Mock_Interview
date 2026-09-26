// A small, curated offline bank. These are explicitly labeled practice questions,
// not claims of live model generation. Each scenario has a concrete task.
const scenarios = [
  { match: /process scheduling/i, concepts: ['time quantum', 'fairness', 'context switching'], questions: [
    'Two programs need the CPU at the same time. Walk through a small example of how round robin scheduling shares CPU time.',
    'A server runs short interactive requests alongside long batch jobs. How would you schedule them to keep interactive requests responsive?',
    'A large service meets average latency targets but misses its p99 target during batch jobs. How would you isolate and validate a scheduling bottleneck?',
  ] },
  { match: /virtual memory|memory management|paging/i, concepts: ['page faults', 'working set', 'replacement policy'], questions: [
    'A program accesses a page that is not in physical memory. Walk through what the operating system does next, step by step.',
    'An application gets slower after its working set exceeds RAM. How would you distinguish excessive paging from a CPU bottleneck?',
    'A large multi-tenant server starts thrashing although CPU usage is low. How would you validate the cause and choose a memory isolation policy?',
  ] },
  { match: /deadlock/i, concepts: ['lock ordering', 'circular wait', 'deadlock prevention'], questions: [
    'Thread A holds lock X and waits for Y; thread B holds Y and waits for X. Explain why neither thread can finish.',
    'Two bank transfers lock accounts in opposite order and occasionally hang. How would you prevent the deadlock without serializing every transfer?',
    'A large service uses nested database and application locks and occasionally stalls. How would you validate a lock-ordering fix under concurrent traffic?',
  ] },
  { match: /file system/i, concepts: ['atomic rename', 'durability', 'crash recovery'], questions: [
    'A program writes a file and the power fails before it closes it. What data might survive, and why?',
    'You need to replace a configuration file without readers ever seeing a partial write. How would you implement that?',
    'A file service acknowledges writes that disappear after a crash. How would you validate the durability guarantees across its storage layers?',
  ] },
  { match: /sliding window/i, concepts: ['window bounds', 'duplicate tracking', 'time complexity'], questions: [
    'Find the length of the longest substring with no repeated characters in "abba". Start with a brute-force approach and work through the example.',
    'Given a string, find the length of its longest substring without repeated characters. Explain how you move the window boundaries for "abba".',
    'Characters arrive as a large stream. Find the longest window with at most K distinct characters, and explain how you would validate your memory bound.',
  ] },
  { match: /two pointers/i, concepts: ['sorted order', 'pointer invariant', 'time complexity'], questions: [
    'Given the sorted array [1, 2, 4, 7, 11] and target 9, find a matching pair. Compare brute-force search with using two pointers.',
    'Given sorted integers and a target sum, find a pair without extra storage. Why is it safe to discard values as either pointer moves?',
    'Find all unique triplets summing to zero in a large integer array. How would you avoid duplicate results and validate your complexity?',
  ] },
  { match: /hashing/i, concepts: ['hash lookup', 'collisions', 'space complexity'], questions: [
    'Find the first repeated value in [3, 1, 4, 1, 3]. Walk through a hash-set solution step by step.',
    'Find two array elements that sum to a target in one pass. How does your approach handle repeated values such as [3, 3] with target 6?',
    'You must detect repeated identifiers in a large stream that exceeds RAM. What accuracy and memory tradeoff would you make, and how would you validate it?',
  ] },
  { match: /prefix sums/i, concepts: ['prefix difference', 'negative numbers', 'time complexity'], questions: [
    'For [2, -1, 3, 4], compute prefix sums and use them to find the sum from index 1 to index 3. Explain each step.',
    'Count contiguous subarrays whose sum equals K, including when values are negative. Explain why a sliding window may fail here.',
    'A large array must support range-sum queries and frequent point updates. What would replace a static prefix-sum array, and how would you validate the tradeoff?',
  ] },
  { match: /conflict resolution/i, concepts: ['disagreement', 'communication', 'outcome'], questions: [
    'Tell me about a disagreement during a team assignment. What did you do to understand the other perspective?',
    'Describe a time you disagreed with a technical decision. How did you help the team reach a decision?',
    'Tell me about a high-stakes disagreement across teams. How did you validate the competing concerns and reach a decision without direct authority?',
  ] },
  { match: /ownership|communication|learning from failure/i, concepts: ['personal action', 'outcome', 'reflection'], questions: [
    'Tell me about a task that did not go as planned. Walk through the steps you took to get it back on track.',
    'Describe a time you discovered a problem outside your assigned work. What did you decide to do?',
    'Tell me about a decision you owned that caused a significant setback. How did you validate the root cause and change the way the team worked?',
  ] },
];

export function practiceScenario(topic, level) {
  const scenario = scenarios.find((item) => item.match.test(topic));
  if (!scenario) return null;
  return { questionText: scenario.questions[level === 'beginner' ? 0 : level === 'advanced' ? 2 : 1], concepts: scenario.concepts };
}

export function technicalAnswerProbe(answer, topic, depth = 0) {
  const probes = [
    [/round robin|time quantum/i, ['You described round robin scheduling. What happens to responsiveness if the time quantum is much too large?', 'You mentioned the time quantum. How would you measure whether context-switch overhead outweighs the responsiveness benefit?']],
    [/context switch/i, ['You mentioned context switching. What work does a switch perform that makes frequent switches expensive?', 'How would you test whether context switching is the bottleneck in your example?']],
    [/sliding window|window bound/i, ['What invariant stays true as you move the window boundaries in your approach?', 'Give a small input that would expose an off-by-one error in your window updates.']],
    [/hash map|hashmap|hash set|hashset/i, ['You chose a hash-based structure. How does your approach handle duplicate values?', 'What changes if hash collisions become frequent in your approach?']],
    [/lock order|deadlock/i, ['How would a consistent ordering of locks change the scenario you described?', 'How would you test that your locking strategy stays safe when three threads compete?']],
    [/page fault|paging/i, ['You mentioned paging. How would you distinguish a normal page fault from a sign of memory pressure?', 'What measurement would show that your change actually reduced paging?']],
    [/index|indexes/i, ['You mentioned indexes. Which query pattern should the index serve in your example?', 'How would that index affect writes, and what measurement would justify the extra cost?']],
  ];
  if (depth > 1) return null;
  const match = probes.find(([pattern]) => pattern.test(answer));
  return match ? { questionText: match[1][depth], topic } : null;
}
