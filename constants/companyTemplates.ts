// Types are defined in types/index.d.ts

// Empty array of company templates
// Previously contained hardcoded templates for Google, Amazon, Meta, and Microsoft
export const companyTemplates: CompanyTemplate[] = [
  /* Example template structure:
  {
    id: "template-00",
    companyName: "Company Name",
    companyLogo: "/companies/logo.png",
    description: "Description of the interview process",
    isActive: true,
    createdAt: new Date().toISOString(),
    rounds: [
      {
        id: "round-1762681045389",
        name: "Ap",
        type: "aptitude", // or "voice", "code", "text"
        duration: 5, // in minutes
        // Instead of storing questions directly, reference a question bank
        questionBankId: "aptitude-bank-123", // ID of the question bank
        questionCount: 10, // Number of questions to use from the bank
        passingScore: 70
      },
      {
        id: "round-1762681045390",
        name: "Coding Challenge",
        type: "code",
        duration: 30,
        questionBankId: "coding-bank-456",
        questionCount: 2,
        passingScore: 60
      },
      {
        id: "round-1762681045391",
        name: "Technical Interview",
        type: "voice",
        duration: 45,
        promptTemplateId: "prompt-789", // For voice/text interviews, reference a prompt template
        passingScore: 70
      }
    ]
  }
  */
];