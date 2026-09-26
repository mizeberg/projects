import { branches, paperForBranch, type Branch } from "./branches.js";
export { branches, type Branch } from "./branches.js";
export type Question = {
  id: string;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
};
export type Topic = {
  id: string;
  title: string;
  subject: string;
  region: string;
  branches: Branch[];
  minutes: number;
  xp: number;
  color: string;
  description: string;
  concept: string;
  formula: string;
  example: string;
  questions: Question[];
};
const all = branches;
export const topics: Topic[] = [
  {
    id: "boolean",
    title: "Master Boolean Algebra",
    subject: "Digital Electronics",
    region: "Boolean Forest",
    branches: ["ECE", "CSE", "AIML", "Cybersecurity"],
    minutes: 25,
    xp: 150,
    color: "green",
    description:
      "Small rules. Powerful logic. Build the foundation of every digital circuit.",
    concept:
      "Boolean algebra works with two values: 0 and 1. AND (·) is 1 only when both inputs are 1. OR (+) is 1 when at least one input is 1. NOT (\u2032) inverts the input. The absorption law A + A·B = A means an extra condition cannot add anything once A is already true.",
    formula: "A + A·B = A",
    example:
      "Simplify X + X·Y. Factor X: X·(1 + Y). In Boolean algebra, 1 + Y = 1. Therefore X·1 = X. This is the absorption law.",
    questions: [
      {
        id: "b1",
        prompt: "Simplify the Boolean expression A + A·B.",
        options: ["A", "B", "A·B", "A + B"],
        correct: 0,
        explanation:
          "By the absorption law, A + A·B = A. If A is 1 the expression is 1; if A is 0 both terms are 0.",
      },
      {
        id: "b2",
        prompt: "Which expression is equivalent to (A·B)′?",
        options: ["A′·B′", "A′ + B′", "A + B", "A·B"],
        correct: 1,
        explanation:
          "De Morgan’s law: the complement of an AND is the OR of the complements: (A·B)′ = A′ + B′.",
      },
      {
        id: "b3",
        prompt:
          "A sensor alarm should trigger if either input is 1. Which logic operation fits?",
        options: ["AND", "NOT", "OR", "XNOR"],
        correct: 2,
        explanation:
          "OR produces 1 whenever at least one input is 1. AND would require both inputs to be 1.",
      },
    ],
  },
  {
    id: "probability",
    title: "Explore Probability",
    subject: "General Aptitude",
    region: "Probability Peaks",
    branches: all,
    minutes: 20,
    xp: 150,
    color: "purple",
    description:
      "Turn uncertainty into a tool. Learn to reason about possible outcomes.",
    concept:
      "For equally likely outcomes, probability is the number of favorable outcomes divided by the total number of outcomes. For independent events, P(A and B) = P(A)·P(B). Independence means learning that one event happened does not change the probability of the other.",
    formula: "P(A ∩ B) = P(A) · P(B)  (independent events)",
    example:
      "Toss a fair coin twice. The equally likely outcomes are HH, HT, TH, TT. Only HH has two heads, so P(two heads) = 1/4.",
    questions: [
      {
        id: "p1",
        prompt:
          "A fair coin is tossed twice. What is the probability of exactly one head?",
        options: ["1/4", "1/2", "3/4", "1"],
        correct: 1,
        explanation:
          "HT and TH are two favorable outcomes out of HH, HT, TH, TT. The probability is 2/4 = 1/2.",
      },
      {
        id: "p2",
        prompt:
          "Two independent components work with probabilities 0.8 and 0.5. What is the probability both work?",
        options: ["0.3", "1.3", "0.4", "0.8"],
        correct: 2,
        explanation:
          "For independent events, multiply the probabilities: 0.8 × 0.5 = 0.4.",
      },
      {
        id: "p3",
        prompt: "Which is always true of the probability of an event?",
        options: [
          "It is greater than 1",
          "It is between 0 and 1 inclusive",
          "It is always 0.5",
          "It can be negative",
        ],
        correct: 1,
        explanation: "A probability ranges from 0 (impossible) to 1 (certain).",
      },
    ],
  },
  {
    id: "circuits",
    title: "Decode Circuit Laws",
    subject: "Network Theory",
    region: "Circuit Citadel",
    branches: ["ECE"],
    minutes: 30,
    xp: 150,
    color: "blue",
    description:
      "Follow the current. Understand the rules that make circuits work.",
    concept:
      "Ohm’s law relates voltage, current, and resistance: V = IR, for an ohmic resistor. Kirchhoff’s current law follows conservation of charge: total current entering a node equals total current leaving it. Resistances in series add.",
    formula: "V = I · R",
    example:
      "A 12 V source is connected across a 4 Ω resistor. By Ohm’s law, I = V/R = 12/4 = 3 A.",
    questions: [
      {
        id: "c1",
        prompt: "A 10 Ω resistor carries 2 A. What is the voltage across it?",
        options: ["5 V", "12 V", "20 V", "0.2 V"],
        correct: 2,
        explanation: "V = IR = 2 × 10 = 20 V.",
      },
      {
        id: "c2",
        prompt:
          "Currents of 3 A and 2 A enter a node. One current leaves. What is its value?",
        options: ["1 A", "5 A", "6 A", "0 A"],
        correct: 1,
        explanation:
          "By Kirchhoff’s current law, the leaving current equals 3 + 2 = 5 A.",
      },
      {
        id: "c3",
        prompt:
          "Two resistors of 4 Ω and 6 Ω are in series. What is the equivalent resistance?",
        options: ["2.4 Ω", "2 Ω", "24 Ω", "10 Ω"],
        correct: 3,
        explanation: "Series resistances add: 4 + 6 = 10 Ω.",
      },
    ],
  },
  {
    id: "complexity",
    title: "Think in Algorithms",
    subject: "Programming & Algorithms",
    region: "Algorithm Archipelago",
    branches: ["CSE", "AIML", "Cybersecurity"],
    minutes: 25,
    xp: 150,
    color: "blue",
    description: "Find the pattern behind efficient problem solving.",
    concept:
      "Time complexity describes how the work of an algorithm grows with input size. A single traversal of n items is O(n). Two fully nested loops that each traverse n items perform n² iterations, so the work is O(n²). Binary search halves a sorted search space at each step.",
    formula: "Binary search: O(log n)",
    example:
      "For 16 sorted elements, repeatedly halving the search space takes about log₂16 = 4 halvings.",
    questions: [
      {
        id: "a1",
        prompt: "What is the time complexity of visiting each of n items once?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        correct: 2,
        explanation: "The amount of work grows linearly with n, so it is O(n).",
      },
      {
        id: "a2",
        prompt: "What condition does standard binary search require?",
        options: [
          "Random input",
          "Sorted input",
          "Only positive numbers",
          "A prime input size",
        ],
        correct: 1,
        explanation:
          "Sorted input lets binary search determine which half can be discarded.",
      },
      {
        id: "a3",
        prompt:
          "Two fully nested loops each run n times. How many inner iterations occur?",
        options: ["n", "2n", "log n", "n²"],
        correct: 3,
        explanation:
          "For every one of n outer iterations, the inner loop runs n times: n × n = n².",
      },
    ],
  },
  {
    id: "statics",
    title: "Find Your Equilibrium",
    subject: "Engineering Mechanics",
    region: "Equilibrium Heights",
    branches: ["Mechanical", "Civil"],
    minutes: 25,
    xp: 150,
    color: "blue",
    description: "Explore the balance of forces behind stable structures.",
    concept:
      "For a rigid body in static equilibrium, the vector sum of forces and the sum of moments must both be zero. A moment is a force multiplied by the perpendicular distance from the pivot to the line of action.",
    formula: "ΣF = 0,  ΣM = 0",
    example:
      "A 10 N force acts at a perpendicular distance of 2 m from a pivot. Its moment magnitude is 10 × 2 = 20 N·m.",
    questions: [
      {
        id: "s1",
        prompt:
          "A 5 N force acts 3 m perpendicular to a pivot. What is the moment magnitude?",
        options: ["15 N·m", "8 N·m", "1.67 N·m", "0 N·m"],
        correct: 0,
        explanation:
          "Moment = force × perpendicular distance = 5 × 3 = 15 N·m.",
      },
      {
        id: "s2",
        prompt: "A rigid body in static equilibrium must have:",
        options: [
          "Zero total force only",
          "Zero total moment only",
          "Zero total force and moment",
          "Nonzero acceleration",
        ],
        correct: 2,
        explanation:
          "Both translational and rotational equilibrium are required.",
      },
      {
        id: "s3",
        prompt:
          "Two opposite, collinear forces of equal magnitude act on a body. Their resultant force is:",
        options: ["Twice either force", "Zero", "Half either force", "Unknown"],
        correct: 1,
        explanation:
          "Equal and opposite collinear forces cancel, giving zero resultant force and moment.",
      },
    ],
  },
  {
    id: "ratios",
    title: "Reason with Ratios",
    subject: "General Aptitude",
    region: "Reasoning Camp",
    branches: all,
    minutes: 15,
    xp: 150,
    color: "green",
    description: "Build the quantitative reasoning used across GATE papers.",
    concept:
      "A ratio compares quantities in the same units. To divide a total in the ratio a:b, split it into a+b equal parts, then allocate a parts to the first quantity and b parts to the second. A percentage is a ratio with denominator 100.",
    formula: "First share = total × a / (a + b)",
    example:
      "Divide 60 study minutes between concepts and practice in a 2:3 ratio. There are 5 parts, each worth 12 minutes. Concepts receive 24 minutes and practice receives 36.",
    questions: [
      {
        id: "r1",
        prompt: "Divide 80 in the ratio 3:5. What is the smaller share?",
        options: ["16", "30", "40", "50"],
        correct: 1,
        explanation:
          "There are 3+5=8 equal parts. Each is 80/8=10, so the smaller share is 3×10=30.",
      },
      {
        id: "r2",
        prompt:
          "A price rises from 200 to 250. What is the percentage increase?",
        options: ["20%", "25%", "50%", "125%"],
        correct: 1,
        explanation:
          "The increase is 50 relative to the original 200. (50/200)×100=25%.",
      },
      {
        id: "r3",
        prompt:
          "Two lengths are 1 metre and 50 centimetres. What is their ratio in that order?",
        options: ["1:50", "1:2", "2:1", "50:1"],
        correct: 2,
        explanation: "Convert to matching units: 100 cm : 50 cm = 2:1.",
      },
    ],
  },
];
export const getTopics = (branch: Branch) =>
  topics.filter((t) =>
    t.branches.some((b) => paperForBranch(b) === paperForBranch(branch)),
  );
export const getTopic = (id: string) =>
  topics.find((t) => t.id === id) ?? topics[0];
