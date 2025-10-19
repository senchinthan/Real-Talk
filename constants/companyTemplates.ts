import { CompanyTemplate } from "@/types";

export const companyTemplates: CompanyTemplate[] = [
  {
    id: "google",
    companyName: "Google",
    companyLogo: "/companies/google.png",
    description: "Standard Google Software Engineer interview process with phone screen and onsite rounds",
    isActive: true,
    createdAt: new Date().toISOString(),
    rounds: [
      {
        id: "google-phone",
        name: "Phone Screen",
        type: "voice",
        duration: 45,
        questions: [
          "Tell me about yourself and your background in software engineering",
          "What's your experience with data structures and algorithms?",
          "Can you explain a challenging technical problem you solved recently?",
          "Why are you interested in working at Google?",
          "What questions do you have about the role or Google?"
        ],
        passingScore: 70
      },
      {
        id: "google-coding-1",
        name: "Coding Round 1",
        type: "voice",
        duration: 45,
        questions: [
          "Implement a function to find the longest common subsequence between two strings",
          "Design an algorithm to find the kth largest element in an unsorted array",
          "Write a function to validate if a binary tree is a valid BST",
          "Implement a LRU cache with O(1) operations",
          "Solve the two sum problem and discuss time/space complexity"
        ],
        passingScore: 75
      },
      {
        id: "google-coding-2",
        name: "Coding Round 2",
        type: "voice",
        duration: 45,
        questions: [
          "Design and implement a rate limiter",
          "Implement a thread-safe singleton pattern",
          "Write a function to serialize and deserialize a binary tree",
          "Design an algorithm for finding the shortest path in a weighted graph",
          "Implement a distributed cache with consistent hashing"
        ],
        passingScore: 75
      },
      {
        id: "google-system-design",
        name: "System Design",
        type: "voice",
        duration: 60,
        questions: [
          "Design a URL shortener like bit.ly",
          "How would you design a distributed chat system like WhatsApp?",
          "Design a recommendation system for YouTube",
          "How would you scale a social media feed like Twitter?",
          "Design a distributed file storage system"
        ],
        passingScore: 70
      },
      {
        id: "google-behavioral",
        name: "Behavioral & Leadership",
        type: "voice",
        duration: 45,
        questions: [
          "Tell me about a time you had to work with a difficult team member",
          "Describe a situation where you had to make a technical decision with limited information",
          "How do you stay updated with the latest technologies and trends?",
          "Tell me about a project where you had to learn a new technology quickly",
          "How do you approach debugging complex production issues?"
        ],
        passingScore: 70
      }
    ]
  },
  {
    id: "amazon",
    companyName: "Amazon",
    companyLogo: "/companies/amazon.png",
    description: "Amazon Software Development Engineer interview process with online assessment and onsite loop",
    isActive: true,
    createdAt: new Date().toISOString(),
    rounds: [
      {
        id: "amazon-oa",
        name: "Online Assessment",
        type: "code",
        duration: 90,
        questions: [
          "Implement a function to find the maximum profit from stock trading",
          "Design an algorithm to find the longest palindromic subsequence",
          "Implement a function to merge k sorted linked lists",
          "Write a function to find the number of islands in a 2D grid",
          "Implement a function to validate parentheses with different types"
        ],
        passingScore: 80
      },
      {
        id: "amazon-phone",
        name: "Phone Screen",
        type: "voice",
        duration: 60,
        questions: [
          "Tell me about your experience with AWS services",
          "Describe a time when you had to optimize a slow-running system",
          "How would you design a scalable e-commerce system?",
          "What's your approach to handling high-traffic applications?",
          "Tell me about a challenging bug you debugged in production"
        ],
        passingScore: 70
      },
      {
        id: "amazon-coding-1",
        name: "Coding Round 1",
        type: "voice",
        duration: 60,
        questions: [
          "Implement a function to find the longest increasing subsequence",
          "Design an algorithm to find the median of two sorted arrays",
          "Write a function to implement a trie data structure",
          "Implement a function to find all anagrams in a string",
          "Design a system to handle millions of concurrent users"
        ],
        passingScore: 75
      },
      {
        id: "amazon-coding-2",
        name: "Coding Round 2",
        type: "voice",
        duration: 60,
        questions: [
          "Implement a function to find the longest common substring",
          "Design an algorithm for finding the shortest path in a maze",
          "Write a function to implement a thread-safe queue",
          "Implement a function to serialize and deserialize a binary tree",
          "Design a distributed logging system"
        ],
        passingScore: 75
      },
      {
        id: "amazon-system-design",
        name: "System Design",
        type: "voice",
        duration: 60,
        questions: [
          "Design a distributed cache system like Redis",
          "How would you design a recommendation engine for Amazon?",
          "Design a system to handle Black Friday traffic spikes",
          "How would you design a distributed database system?",
          "Design a real-time notification system for millions of users"
        ],
        passingScore: 70
      },
      {
        id: "amazon-leadership",
        name: "Leadership Principles",
        type: "voice",
        duration: 45,
        questions: [
          "Tell me about a time when you had to disagree with your manager",
          "Describe a situation where you had to deliver bad news to stakeholders",
          "How do you ensure high quality in your code and deliverables?",
          "Tell me about a time when you had to learn from a customer",
          "Describe a situation where you had to work with limited resources"
        ],
        passingScore: 70
      }
    ]
  },
  {
    id: "meta",
    companyName: "Meta",
    companyLogo: "/companies/meta.png",
    description: "Meta Software Engineer interview process with phone screen and onsite technical rounds",
    isActive: true,
    createdAt: new Date().toISOString(),
    rounds: [
      {
        id: "meta-phone",
        name: "Phone Screen",
        type: "voice",
        duration: 45,
        questions: [
          "Tell me about your experience with React and frontend development",
          "What's your experience with mobile development and React Native?",
          "How do you approach performance optimization in web applications?",
          "Tell me about a time when you had to work with a large codebase",
          "What interests you about working at Meta?"
        ],
        passingScore: 70
      },
      {
        id: "meta-coding-1",
        name: "Coding Round 1",
        type: "voice",
        duration: 45,
        questions: [
          "Implement a function to find the longest palindromic substring",
          "Design an algorithm to find the kth largest element in a stream",
          "Write a function to implement a basic calculator",
          "Implement a function to find the minimum window substring",
          "Design an algorithm for finding the longest common subsequence"
        ],
        passingScore: 75
      },
      {
        id: "meta-coding-2",
        name: "Coding Round 2",
        type: "voice",
        duration: 45,
        questions: [
          "Implement a function to find the number of ways to climb stairs",
          "Design an algorithm to find the maximum subarray sum",
          "Write a function to implement a basic text editor",
          "Implement a function to find the longest increasing path in a matrix",
          "Design an algorithm for finding the shortest path in a binary maze"
        ],
        passingScore: 75
      },
      {
        id: "meta-system-design",
        name: "System Design",
        type: "voice",
        duration: 60,
        questions: [
          "Design a social media feed like Facebook's news feed",
          "How would you design a real-time messaging system like WhatsApp?",
          "Design a photo sharing system like Instagram",
          "How would you design a distributed video streaming system?",
          "Design a system to handle viral content and traffic spikes"
        ],
        passingScore: 70
      },
      {
        id: "meta-behavioral",
        name: "Behavioral & Culture",
        type: "voice",
        duration: 45,
        questions: [
          "Tell me about a time when you had to work with a diverse team",
          "Describe a situation where you had to pivot quickly on a project",
          "How do you approach building inclusive products?",
          "Tell me about a time when you had to learn from user feedback",
          "How do you stay motivated when working on long-term projects?"
        ],
        passingScore: 70
      }
    ]
  },
  {
    id: "microsoft",
    companyName: "Microsoft",
    companyLogo: "/companies/microsoft.png",
    description: "Microsoft Software Engineer interview process with technical and behavioral rounds",
    isActive: true,
    createdAt: new Date().toISOString(),
    rounds: [
      {
        id: "microsoft-phone",
        name: "Phone Screen",
        type: "voice",
        duration: 45,
        questions: [
          "Tell me about your experience with cloud technologies and Azure",
          "What's your experience with .NET and C# development?",
          "How do you approach software testing and quality assurance?",
          "Tell me about a time when you had to work with legacy systems",
          "What interests you about working at Microsoft?"
        ],
        passingScore: 70
      },
      {
        id: "microsoft-coding-1",
        name: "Coding Round 1",
        type: "voice",
        duration: 60,
        questions: [
          "Implement a function to find the longest common prefix",
          "Design an algorithm to find the maximum product of three numbers",
          "Write a function to implement a basic hash table",
          "Implement a function to find the longest consecutive sequence",
          "Design an algorithm for finding the shortest path in a grid"
        ],
        passingScore: 75
      },
      {
        id: "microsoft-coding-2",
        name: "Coding Round 2",
        type: "voice",
        duration: 60,
        questions: [
          "Implement a function to find the median of a data stream",
          "Design an algorithm to find the longest increasing subsequence",
          "Write a function to implement a basic trie",
          "Implement a function to find the maximum sum of non-adjacent elements",
          "Design an algorithm for finding the shortest path in a weighted graph"
        ],
        passingScore: 75
      },
      {
        id: "microsoft-system-design",
        name: "System Design",
        type: "voice",
        duration: 60,
        questions: [
          "Design a distributed file system like Azure Blob Storage",
          "How would you design a real-time collaboration system like Office 365?",
          "Design a system to handle millions of concurrent users for Teams",
          "How would you design a distributed database system?",
          "Design a system to handle large-scale data processing"
        ],
        passingScore: 70
      },
      {
        id: "microsoft-behavioral",
        name: "Behavioral & Leadership",
        type: "voice",
        duration: 45,
        questions: [
          "Tell me about a time when you had to work with a difficult stakeholder",
          "Describe a situation where you had to make a technical decision with business impact",
          "How do you approach mentoring junior developers?",
          "Tell me about a time when you had to learn a new technology quickly",
          "How do you ensure your code is maintainable and scalable?"
        ],
        passingScore: 70
      }
    ]
  }
];
