export interface PersonalInfo {
    fullName: string
    email: string
    phone: string
    location: string
    linkedin?: string
    website?: string
    photo?: string // Added photo field
  }
  
  export interface Experience {
    id: string
    company: string
    position: string
    startDate: string
    endDate: string
    current: boolean
    description: string
    achievements: string[]
  }
  
  export interface Education {
    id: string
    institution: string
    degree: string
    field: string
    startDate: string
    endDate: string
    gpa?: string
  }
  
  export interface Skill {
    id: string
    name: string
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
    category: string
  }
  
  export interface Certification {
    id: string
    name: string
    issuer: string
    date: string
    expiryDate?: string
  }
  
  export interface Language {
    id: string
    name: string
    proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native'
  }
  
  export interface ColorScheme {
    primary: string
    secondary: string
    accent: string
    text: string
    background: string
  }
  
  export interface CVData {
    personalInfo: PersonalInfo
    summary: string
    experience: Experience[]
    education: Education[]
    skills: Skill[]
    certifications: Certification[]
    languages: Language[]
    colorScheme: ColorScheme // Add color scheme to CV data
  }
  
  export type CVTemplate = 'professional' | 'modern' | 'creative'
  