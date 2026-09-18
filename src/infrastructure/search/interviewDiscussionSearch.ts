export interface InterviewDiscussion {
  title: string;
  url: string;
  snippet: string;
}

export const searchInterviewDiscussions = async (
  _company: string,
  _role: string,
): Promise<InterviewDiscussion[]> => {
  // Search provider will be connected here.
  return [];
};