export interface Requirement {
  id: string;
  text: string;
  category: string;
  priority: "must" | "nice";
}