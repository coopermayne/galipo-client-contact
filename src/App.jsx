import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from 'react'
import { HashRouter, Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, ChevronUp, Plus, Trash2, Lock, Eye, Clock, CheckCircle, Loader2, AlertCircle, Download, Copy, Upload, ExternalLink, MessageCircle, X, LogOut } from 'lucide-react'

// ============================================================================
// AUTHENTICATION CONTEXT
// ============================================================================

const AuthContext = createContext(null)

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('authToken'))
  const [role, setRole] = useState(() => localStorage.getItem('authRole'))
  const [clientSlug, setClientSlug] = useState(() => localStorage.getItem('authClientSlug'))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const login = async (password, targetClientSlug = null) => {
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, clientSlug: targetClientSlug })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store auth data
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('authRole', data.role)
      if (data.clientSlug) {
        localStorage.setItem('authClientSlug', data.clientSlug)
      }

      setToken(data.token)
      setRole(data.role)
      setClientSlug(data.clientSlug || null)

      return { success: true, role: data.role }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authRole')
    localStorage.removeItem('authClientSlug')
    setToken(null)
    setRole(null)
    setClientSlug(null)
  }

  // Helper for authenticated fetch
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }

    const res = await fetch(url, { ...options, headers })

    // Handle token expiration
    if (res.status === 401) {
      logout()
      throw new Error('Session expired. Please log in again.')
    }

    return res
  }

  const isAuthenticated = !!token
  const isAttorney = role === 'attorney'
  const isClient = role === 'client'

  // Check if current user can access a specific client's data
  const canAccessClient = (targetSlug) => {
    if (isAttorney) return true
    if (isClient && clientSlug === targetSlug) return true
    return false
  }

  return (
    <AuthContext.Provider value={{
      token,
      role,
      clientSlug,
      isAuthenticated,
      isAttorney,
      isClient,
      isLoading,
      error,
      login,
      logout,
      authFetch,
      canAccessClient
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================================
// CLIENT CONFIGURATIONS
// ============================================================================

const CLIENTS = {
  'alvarado-pool': {
    clientName: 'Shalymmar Pool',
    caseName: 'Alvarado v. State of California, et al.',
    caseNumber: '25STCV35294',
    decedent: 'Dominick Alvarado',
    decedentDOD: 'July 21, 2023',
    deadline: 'January 26, 2026',
    passwordPrefix: 'Pool',
    dropboxLink: 'https://www.dropbox.com/request/9hnjYKu87tKg0a8T8FD8',
    sections: [
      {
        id: 'basic-info',
        title: 'A. Your Basic Information',
        questions: [
          { id: 'nameDisplay', type: 'static', label: 'Your name as it appears in court records:', value: 'Shalymmar Pool' },
          { id: 'nameNeedsCorrection', type: 'yesno', label: 'Does the spelling of your name need to be corrected?', rogRef: '2.1(a)' },
          { id: 'correctedName', type: 'text', label: 'Please provide the correct spelling of your name', showIf: 'nameNeedsCorrection', rogRef: '2.1(a)' },
          { id: 'hasOtherNames', type: 'yesno', label: 'Have you ever used any other names (maiden, nickname, alias)?', rogRef: '2.1(b)' },
          { id: 'otherNamesList', type: 'repeatable', label: 'Other names used', showIf: 'hasOtherNames', rogRef: '2.1(b)(c)', fields: [
            { id: 'name', type: 'text', label: 'Name' },
            { id: 'datesUsed', type: 'text', label: 'Approximate dates used' }
          ]},
          { id: 'dateOfBirth', type: 'date', label: 'Date of birth', rogRef: '2.2' },
          { id: 'placeOfBirth', type: 'text', label: 'Place of birth (city, state, country)', rogRef: '2.2' },
          { id: 'currentAddress', type: 'textarea', label: 'Current address (street, city, state, zip)', rogRef: '2.5(a)' },
          { id: 'currentPhone', type: 'text', label: 'Current phone number', rogRef: '2.5(a)' },
          { id: 'hasPriorAddresses', type: 'yesno', label: 'Have you lived at any other addresses in the past 5 years?', rogRef: '2.5(b)' },
          { id: 'priorAddresses', type: 'repeatable', label: 'Prior addresses', showIf: 'hasPriorAddresses', rogRef: '2.5(b)(c)', fields: [
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'dates', type: 'text', label: 'Dates lived there (from - to)' }
          ]},
          { id: 'hadDriversLicense', type: 'yesno', label: 'At the time of Dominick\'s death (July 21, 2023), did you have a driver\'s license?', rogRef: '2.3' },
          { id: 'driversLicenseDetails', type: 'repeatable', label: 'Driver\'s license details', showIf: 'hadDriversLicense', rogRef: '2.3(a-d)', fields: [
            { id: 'state', type: 'text', label: 'Issuing state' },
            { id: 'licenseNumber', type: 'text', label: 'License number' },
            { id: 'type', type: 'text', label: 'License type (e.g., Class C)' },
            { id: 'issueDate', type: 'text', label: 'Date of issuance' },
            { id: 'restrictions', type: 'text', label: 'Any restrictions (or "None")' }
          ]},
          { id: 'hadOtherPermit', type: 'yesno', label: 'Did you have any other permit or license for operation of a motor vehicle at that time?', rogRef: '2.4' },
          { id: 'otherPermitDetails', type: 'repeatable', label: 'Other permits/licenses', showIf: 'hadOtherPermit', rogRef: '2.4(a-d)', fields: [
            { id: 'state', type: 'text', label: 'Issuing state/entity' },
            { id: 'licenseNumber', type: 'text', label: 'License/permit number' },
            { id: 'type', type: 'text', label: 'Type' },
            { id: 'issueDate', type: 'text', label: 'Date of issuance' },
            { id: 'restrictions', type: 'text', label: 'Any restrictions' }
          ]},
          { id: 'speaksEnglish', type: 'yesno', label: 'Do you speak English with ease?', rogRef: '2.9' },
          { id: 'speaksEnglishLanguage', type: 'text', label: 'What language and dialect do you normally use?', showIf: 'speaksEnglish', showIfValue: false, rogRef: '2.9' },
          { id: 'readsWritesEnglish', type: 'yesno', label: 'Do you read and write English with ease?', rogRef: '2.10' },
          { id: 'readsWritesEnglishLanguage', type: 'text', label: 'What language and dialect do you normally use for reading/writing?', showIf: 'readsWritesEnglish', showIfValue: false, rogRef: '2.10' },
          { id: 'hasFelony', type: 'yesno', label: 'Have you ever been convicted of a felony?', rogRef: '2.8' },
          { id: 'felonyList', type: 'repeatable', label: 'Felony convictions', showIf: 'hasFelony', rogRef: '2.8(a-d)', fields: [
            { id: 'cityState', type: 'text', label: 'City and state where convicted' },
            { id: 'date', type: 'text', label: 'Date of conviction' },
            { id: 'offense', type: 'text', label: 'Offense' },
            { id: 'courtCaseNumber', type: 'text', label: 'Court and case number' }
          ]}
        ]
      },
      {
        id: 'your-background',
        title: 'B. Your Employment & Education',
        questions: [
          { id: 'isCurrentlyEmployed', type: 'yesno', label: 'Are you currently employed or self-employed?', rogRef: '2.6(a)' },
          { id: 'currentEmployer', type: 'textarea', label: 'Current employer or self-employment (name, address, phone number)', showIf: 'isCurrentlyEmployed', rogRef: '2.6(a)' },
          { id: 'hasEmploymentHistory', type: 'yesno', label: 'Have you had any other employers in the past 5 years (before July 2023)?', rogRef: '2.6(b)' },
          { id: 'employmentHistory', type: 'repeatable', label: 'Employment history', showIf: 'hasEmploymentHistory', rogRef: '2.6(b)', fields: [
            { id: 'employer', type: 'text', label: 'Employer name' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'dates', type: 'text', label: 'Dates of employment (from - to)' },
            { id: 'jobTitle', type: 'text', label: 'Job title' },
            { id: 'duties', type: 'text', label: 'Nature of work/duties' }
          ]},
          { id: 'hasEducationBeyondHighSchool', type: 'yesno', label: 'Did you attend any school or training beyond high school?', rogRef: '2.7' },
          { id: 'highSchoolInfo', type: 'text', label: 'High school name and highest grade completed', rogRef: '2.7(a-d)' },
          { id: 'educationHistory', type: 'repeatable', label: 'Education beyond high school', showIf: 'hasEducationBeyondHighSchool', rogRef: '2.7(a-d)', fields: [
            { id: 'schoolName', type: 'text', label: 'School/institution name' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'datesAttended', type: 'text', label: 'Dates attended' },
            { id: 'highestGrade', type: 'text', label: 'Degree or certification received' }
          ]}
        ]
      },
      {
        id: 'incident-questions',
        title: 'C. Questions About Contributing to the Incident',
        description: 'These are standard legal questions asking whether YOU played any role in causing Dominick\'s death. As a family member bringing this lawsuit, you almost certainly did not - so you will likely answer "No" to all of these.',
        questions: [
          { id: 'wasActingAsAgent', type: 'yesno', label: 'At the time of Dominick\'s death, were you acting as an agent or employee for any person in a way that contributed to causing the incident?', rogRef: '2.11' },
          { id: 'agentDetails', type: 'repeatable', label: 'Agency/employment details', showIf: 'wasActingAsAgent', rogRef: '2.11(a-b)', fields: [
            { id: 'name', type: 'text', label: 'Name of that person/entity' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'duties', type: 'textarea', label: 'Description of your duties' }
          ]},
          { id: 'hadDisability', type: 'yesno', label: 'Did you have any physical, emotional, or mental disability or condition that contributed to CAUSING Dominick\'s death?', rogRef: '2.12' },
          { id: 'disabilityDetails', type: 'repeatable', label: 'Disability/condition details', showIf: 'hadDisability', rogRef: '2.12(a-c)', fields: [
            { id: 'personName', type: 'text', label: 'Name of person' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'nature', type: 'textarea', label: 'Nature of the disability or condition' },
            { id: 'howContributed', type: 'textarea', label: 'How it contributed to the incident' }
          ]},
          { id: 'usedSubstances', type: 'yesno', label: 'Within 24 hours before Dominick\'s death, did you use any substance (alcohol, drugs, medication) that contributed to CAUSING the incident?', rogRef: '2.13' },
          { id: 'substanceDetails', type: 'repeatable', label: 'Substance use details', showIf: 'usedSubstances', rogRef: '2.13(a-g)', fields: [
            { id: 'personName', type: 'text', label: 'Name of person' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'substance', type: 'text', label: 'Nature/description of substance' },
            { id: 'quantity', type: 'text', label: 'Quantity used' },
            { id: 'dateTime', type: 'text', label: 'Date and time used' },
            { id: 'location', type: 'text', label: 'Location where used' },
            { id: 'witnesses', type: 'textarea', label: 'Names of persons present when used (name, address, phone)' },
            { id: 'prescriber', type: 'textarea', label: 'If prescribed: healthcare provider name, address, phone, and condition for which prescribed' }
          ]}
        ]
      },
      {
        id: 'relationship',
        title: 'D. Your Relationship to Dominick',
        questions: [
          { id: 'relationshipType', type: 'text', label: 'What is/was your relationship to Dominick?', placeholder: 'e.g., biological mother, adoptive mother, stepmother' },
          { id: 'knowsDominickAddresses', type: 'yesno', label: 'Do you know where Dominick lived in the past 10 years?' },
          { id: 'dominickAddresses', type: 'repeatable', label: 'Dominick\'s addresses', showIf: 'knowsDominickAddresses', fields: [
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'dates', type: 'text', label: 'Dates (from - to)' },
            { id: 'whoLivedWith', type: 'text', label: 'Who did Dominick live with at this address?' }
          ]},
          { id: 'livedWithDominick', type: 'yesno', label: 'Did you ever live with Dominick?' },
          { id: 'livedWithDominickPeriods', type: 'repeatable', label: 'Times you lived with Dominick', showIf: 'livedWithDominick', fields: [
            { id: 'location', type: 'text', label: 'Location/address' },
            { id: 'dates', type: 'text', label: 'Dates (from - to)' }
          ]},
          { id: 'communicationFrequency', type: 'text', label: 'How frequently did you communicate with Dominick?', placeholder: 'e.g., daily, weekly, monthly' },
          { id: 'communicationMethods', type: 'multiselect', label: 'How did you communicate with Dominick? (Select all that apply)', options: ['Phone calls', 'Text messages', 'In person', 'Video calls', 'Social media', 'Email'] }
        ]
      },
      {
        id: 'financial-support',
        title: 'E. Financial Support from Dominick',
        questions: [
          { id: 'receivedAnySupport', type: 'yesno', label: 'Did Dominick ever provide you with any financial support, purchase items for you, or provide household services?' },
          { id: 'receivedFinancialSupport', type: 'yesno', label: 'Did Dominick provide you with direct financial support (cash, payments)?', showIf: 'receivedAnySupport' },
          { id: 'financialSupportDetails', type: 'repeatable', label: 'Financial support received', showIf: 'receivedFinancialSupport', fields: [
            { id: 'dates', type: 'text', label: 'Time period (from - to)' },
            { id: 'monthlyAmount', type: 'text', label: 'Approximate monthly amount' },
            { id: 'howProvided', type: 'text', label: 'How was it provided? (cash, check, Venmo, etc.)' }
          ]},
          { id: 'receivedPurchases', type: 'yesno', label: 'Did Dominick purchase anything for you?', showIf: 'receivedAnySupport' },
          { id: 'purchaseDetails', type: 'repeatable', label: 'Items purchased by Dominick', showIf: 'receivedPurchases', fields: [
            { id: 'item', type: 'text', label: 'Item description' },
            { id: 'cost', type: 'text', label: 'Approximate cost' },
            { id: 'date', type: 'text', label: 'Approximate date' }
          ]},
          { id: 'receivedServices', type: 'yesno', label: 'Did Dominick provide household services for you (repairs, maintenance, etc.)?', showIf: 'receivedAnySupport' },
          { id: 'servicesDetails', type: 'repeatable', label: 'Services provided by Dominick', showIf: 'receivedServices', fields: [
            { id: 'serviceType', type: 'text', label: 'Type of service' },
            { id: 'description', type: 'text', label: 'Description' },
            { id: 'frequency', type: 'text', label: 'How often?' }
          ]}
        ]
      },
      {
        id: 'shared-experiences',
        title: 'F. Relationship & Shared Experiences',
        questions: [
          { id: 'hadSharedExperiences', type: 'yesno', label: 'Did you and Dominick spend time together at events, social gatherings, or vacations?' },
          { id: 'majorLifeEvents', type: 'yesno', label: 'Did Dominick participate in major life events with you (birthdays, holidays, graduations, etc.)?', showIf: 'hadSharedExperiences' },
          { id: 'majorLifeEventsList', type: 'repeatable', label: 'Major life events with Dominick', showIf: 'majorLifeEvents', fields: [
            { id: 'event', type: 'text', label: 'Event type (birthday, holiday, graduation, etc.)' },
            { id: 'date', type: 'text', label: 'Approximate date' },
            { id: 'description', type: 'text', label: 'Description of Dominick\'s participation' }
          ]},
          { id: 'hadSocialEvents', type: 'yesno', label: 'Did you attend other social events together (2013-2023)?', showIf: 'hadSharedExperiences' },
          { id: 'socialEvents', type: 'repeatable', label: 'Social events attended together', showIf: 'hadSocialEvents', fields: [
            { id: 'event', type: 'text', label: 'Event description' },
            { id: 'date', type: 'text', label: 'Approximate date' }
          ]},
          { id: 'hadVacations', type: 'yesno', label: 'Did you take any vacations or trips with Dominick?', showIf: 'hadSharedExperiences' },
          { id: 'vacationDetails', type: 'repeatable', label: 'Vacations/trips with Dominick', showIf: 'hadVacations', fields: [
            { id: 'location', type: 'text', label: 'Location' },
            { id: 'dates', type: 'text', label: 'Dates' }
          ]}
        ]
      },
      {
        id: 'dominick-background',
        title: 'G. Dominick\'s Background, Education & Career',
        questions: [
          { id: 'dominickDOB', type: 'date', label: 'Dominick\'s date of birth' },
          { id: 'dominickPlaceOfBirth', type: 'text', label: 'Dominick\'s place of birth (city, state, country)' },
          { id: 'knowsDominickEducation', type: 'yesno', label: 'Do you know about Dominick\'s education history?' },
          { id: 'dominickEducation', type: 'repeatable', label: 'Dominick\'s education', showIf: 'knowsDominickEducation', fields: [
            { id: 'schoolName', type: 'text', label: 'School name' },
            { id: 'location', type: 'text', label: 'Location' },
            { id: 'datesAttended', type: 'text', label: 'Dates attended (from - to)' },
            { id: 'degreeOrGrade', type: 'text', label: 'Degree or highest grade completed' }
          ]},
          { id: 'knowsDominickEmployment', type: 'yesno', label: 'Do you know about Dominick\'s employment history?' },
          { id: 'dominickEmployment', type: 'repeatable', label: 'Dominick\'s employment', showIf: 'knowsDominickEmployment', fields: [
            { id: 'employer', type: 'text', label: 'Employer name' },
            { id: 'jobTitle', type: 'text', label: 'Job title' },
            { id: 'location', type: 'text', label: 'Location' },
            { id: 'dates', type: 'text', label: 'Dates employed (from - to)' },
            { id: 'duties', type: 'text', label: 'Job duties/responsibilities' }
          ]},
          { id: 'dominickSkillsHobbies', type: 'textarea', label: 'Describe Dominick\'s skills, hobbies, and interests' },
          { id: 'dominickPersonality', type: 'textarea', label: 'Describe Dominick\'s personality and character' },
          { id: 'hasCharacterWitnesses', type: 'yesno', label: 'Are there other people who could speak about Dominick\'s character, personality, or his relationship with you and your family?' },
          { id: 'characterWitnesses', type: 'repeatable', label: 'Character/relationship witnesses', showIf: 'hasCharacterWitnesses', fields: [
            { id: 'name', type: 'text', label: 'Name' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'relationship', type: 'text', label: 'Relationship to Dominick (friend, coworker, neighbor, etc.)' },
            { id: 'whatTheyKnow', type: 'textarea', label: 'What can they speak to? (Dominick\'s character, your relationship with him, etc.)' }
          ]}
        ]
      },
      {
        id: 'health-history',
        title: 'H. Dominick\'s Health & Medical History',
        questions: [
          { id: 'knowsAboutDominickHealth', type: 'yesno', label: 'Do you have any knowledge about Dominick\'s healthcare, medical conditions, medications, mental health treatment, or incarceration history?' },
          { id: 'knowsHealthcareProviders', type: 'yesno', label: 'Do you know of any healthcare providers who treated Dominick?', showIf: 'knowsAboutDominickHealth' },
          { id: 'healthcareProviders', type: 'repeatable', label: 'Healthcare providers', showIf: 'knowsHealthcareProviders', fields: [
            { id: 'name', type: 'text', label: 'Provider/facility name' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'treatment', type: 'text', label: 'Type of treatment' }
          ]},
          { id: 'hadConditionAtIncident', type: 'yesno', label: 'Was Dominick diagnosed with any medical conditions?', showIf: 'knowsAboutDominickHealth' },
          { id: 'conditionsList', type: 'repeatable', label: 'Medical conditions', showIf: 'hadConditionAtIncident', fields: [
            { id: 'condition', type: 'text', label: 'Condition name' },
            { id: 'datesDiagnosed', type: 'text', label: 'When diagnosed' },
            { id: 'treatment', type: 'text', label: 'Treatment received' }
          ]},
          { id: 'hadPrescriptions', type: 'yesno', label: 'Was Dominick taking any prescription medications?', showIf: 'knowsAboutDominickHealth' },
          { id: 'prescriptionDetails', type: 'repeatable', label: 'Prescription medications', showIf: 'hadPrescriptions', fields: [
            { id: 'name', type: 'text', label: 'Medication name' },
            { id: 'dosage', type: 'text', label: 'Dosage' },
            { id: 'doctor', type: 'text', label: 'Prescribing doctor' }
          ]},
          { id: 'hadMentalHealthTreatment', type: 'yesno', label: 'Was Dominick ever a patient at a mental health facility or received mental health treatment?', showIf: 'knowsAboutDominickHealth' },
          { id: 'mentalHealthHistory', type: 'repeatable', label: 'Mental health treatment', showIf: 'hadMentalHealthTreatment', fields: [
            { id: 'facility', type: 'text', label: 'Facility/provider name' },
            { id: 'location', type: 'text', label: 'Location' },
            { id: 'dates', type: 'text', label: 'Dates (from - to)' },
            { id: 'reason', type: 'text', label: 'Reason for treatment' },
            { id: 'description', type: 'textarea', label: 'Description of treatment' }
          ]},
          { id: 'wasIncarcerated', type: 'yesno', label: 'Was Dominick ever incarcerated?', showIf: 'knowsAboutDominickHealth' },
          { id: 'incarcerationHistory', type: 'repeatable', label: 'Incarceration history', showIf: 'wasIncarcerated', fields: [
            { id: 'facility', type: 'text', label: 'Facility name' },
            { id: 'location', type: 'text', label: 'Location' },
            { id: 'dates', type: 'text', label: 'Dates (from - to)' },
            { id: 'charges', type: 'text', label: 'Charges/reason' },
            { id: 'description', type: 'textarea', label: 'Additional details' }
          ]}
        ]
      },
      {
        id: 'your-injuries',
        title: 'I. Your Injuries & Treatment',
        description: 'These questions ask about physical, mental, or emotional injuries YOU have experienced as a result of Dominick\'s death.',
        questions: [
          { id: 'hasInjuries', type: 'yesno', label: 'Do you attribute any physical, mental, or emotional injuries to Dominick\'s death?', rogRef: '6.1' },
          { id: 'injuriesList', type: 'repeatable', label: 'Injuries attributed to the incident', showIf: 'hasInjuries', rogRef: '6.2', fields: [
            { id: 'injury', type: 'text', label: 'Description of injury' },
            { id: 'bodyArea', type: 'text', label: 'Area of body affected (or "emotional/mental")' }
          ]},
          { id: 'hasOngoingComplaints', type: 'yesno', label: 'Do you still have any complaints that you attribute to Dominick\'s death?', showIf: 'hasInjuries', rogRef: '6.3' },
          { id: 'ongoingComplaints', type: 'repeatable', label: 'Ongoing complaints', showIf: 'hasOngoingComplaints', rogRef: '6.3(a-c)', fields: [
            { id: 'description', type: 'textarea', label: 'Description of complaint' },
            { id: 'status', type: 'text', label: 'Is it subsiding, remaining the same, or becoming worse?' },
            { id: 'frequency', type: 'text', label: 'Frequency and duration' }
          ]},
          { id: 'receivedTreatment', type: 'yesno', label: 'Have you received any consultation, examination, or treatment from a healthcare provider for injuries attributed to Dominick\'s death?', showIf: 'hasInjuries', rogRef: '6.4' },
          { id: 'treatmentProviders', type: 'repeatable', label: 'Healthcare providers who treated you', showIf: 'receivedTreatment', rogRef: '6.4(a-d)', fields: [
            { id: 'name', type: 'text', label: 'Provider name' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'treatmentType', type: 'text', label: 'Type of consultation/examination/treatment' },
            { id: 'dates', type: 'text', label: 'Dates of treatment' },
            { id: 'charges', type: 'text', label: 'Charges to date' }
          ]},
          { id: 'tookMedication', type: 'yesno', label: 'Have you taken any medication (prescription or not) as a result of injuries from Dominick\'s death?', showIf: 'hasInjuries', rogRef: '6.5' },
          { id: 'medications', type: 'repeatable', label: 'Medications taken', showIf: 'tookMedication', rogRef: '6.5(a-e)', fields: [
            { id: 'name', type: 'text', label: 'Medication name' },
            { id: 'prescriber', type: 'text', label: 'Person who prescribed/furnished it' },
            { id: 'datePrescribed', type: 'text', label: 'Date prescribed/furnished' },
            { id: 'dateRange', type: 'text', label: 'Dates you began and stopped taking it' },
            { id: 'cost', type: 'text', label: 'Cost to date' }
          ]},
          { id: 'hadOtherMedicalServices', type: 'yesno', label: 'Were there any other medical services (ambulance, nursing, prosthetics, etc.) necessitated by your injuries?', showIf: 'hasInjuries', rogRef: '6.6' },
          { id: 'otherMedicalServices', type: 'repeatable', label: 'Other medical services', showIf: 'hadOtherMedicalServices', rogRef: '6.6(a-d)', fields: [
            { id: 'nature', type: 'text', label: 'Nature of service' },
            { id: 'date', type: 'text', label: 'Date' },
            { id: 'cost', type: 'text', label: 'Cost' },
            { id: 'providerName', type: 'text', label: 'Provider name' },
            { id: 'providerAddress', type: 'text', label: 'Provider address' },
            { id: 'providerPhone', type: 'text', label: 'Provider phone' }
          ]}
        ]
      },
      {
        id: 'your-damages',
        title: 'J. Your Damages & Losses',
        description: 'Please describe how Dominick\'s death has affected you emotionally, financially, and otherwise.',
        questions: [
          { id: 'lossOfLoveDescription', type: 'textarea', label: 'Describe the loss of love, companionship, comfort, care, assistance, protection, affection, society, and moral support you have experienced since Dominick\'s death' },
          { id: 'relationshipBond', type: 'textarea', label: 'Describe the bond and relationship you had with Dominick. What made your relationship special?' },
          { id: 'howLifeChanged', type: 'textarea', label: 'How has your daily life changed since Dominick\'s death?' },
          { id: 'emotionalImpact', type: 'textarea', label: 'Describe the emotional and psychological impact of Dominick\'s death on you' },
          { id: 'futureLosses', type: 'textarea', label: 'Describe any future losses you anticipate (e.g., Dominick not being present for future milestones, holidays, family events)' },
          { id: 'hasPropertyDamage', type: 'yesno', label: 'Do you attribute any loss of or damage to a vehicle or other property to the incident?', rogRef: '7.1' },
          { id: 'propertyDamage', type: 'repeatable', label: 'Property damage', showIf: 'hasPropertyDamage', rogRef: '7.1(a-d)', fields: [
            { id: 'description', type: 'textarea', label: 'Description of property' },
            { id: 'damageNature', type: 'textarea', label: 'Nature and location of damage' },
            { id: 'amount', type: 'text', label: 'Amount of damage claimed and how calculated' },
            { id: 'sold', type: 'textarea', label: 'If sold: seller name/address/phone, date, sale price' }
          ]},
          { id: 'hasPropertyEstimate', type: 'yesno', label: 'Has a written estimate or evaluation been made for any damaged property?', showIf: 'hasPropertyDamage', rogRef: '7.2' },
          { id: 'propertyEstimates', type: 'repeatable', label: 'Property estimates', showIf: 'hasPropertyEstimate', rogRef: '7.2(a-c)', fields: [
            { id: 'preparer', type: 'text', label: 'Name of person who prepared estimate' },
            { id: 'preparerAddress', type: 'text', label: 'Address and phone' },
            { id: 'datePrepared', type: 'text', label: 'Date prepared' },
            { id: 'whoHasCopy', type: 'text', label: 'Who has a copy (name, address, phone)' },
            { id: 'amount', type: 'text', label: 'Amount of damage stated' }
          ]},
          { id: 'propertyRepaired', type: 'yesno', label: 'Has any damaged property been repaired?', showIf: 'hasPropertyDamage', rogRef: '7.3' },
          { id: 'propertyRepairs', type: 'repeatable', label: 'Property repairs', showIf: 'propertyRepaired', rogRef: '7.3(a-e)', fields: [
            { id: 'dateRepaired', type: 'text', label: 'Date repaired' },
            { id: 'description', type: 'text', label: 'Description of repair' },
            { id: 'cost', type: 'text', label: 'Repair cost' },
            { id: 'repairer', type: 'text', label: 'Name of person who repaired it (address, phone)' },
            { id: 'paidBy', type: 'text', label: 'Name of person who paid (address, phone)' }
          ]},
          { id: 'hasLostIncome', type: 'yesno', label: 'Do you attribute any loss of income or earning capacity to Dominick\'s death (e.g., missed work due to grief)?', rogRef: '8.1' },
          { id: 'incomeNatureOfWork', type: 'text', label: 'Nature of your work', showIf: 'hasLostIncome', rogRef: '8.2(a)' },
          { id: 'incomeJobTitle', type: 'text', label: 'Your job title at the time of Dominick\'s death', showIf: 'hasLostIncome', rogRef: '8.2(b)' },
          { id: 'incomeEmploymentStartDate', type: 'text', label: 'Date your employment began', showIf: 'hasLostIncome', rogRef: '8.2(c)' },
          { id: 'incomeLastWorkDate', type: 'text', label: 'Last date before Dominick\'s death that you worked for compensation', showIf: 'hasLostIncome', rogRef: '8.3' },
          { id: 'incomeMonthlyAmount', type: 'text', label: 'Your monthly income at the time of Dominick\'s death and how calculated', showIf: 'hasLostIncome', rogRef: '8.4' },
          { id: 'incomeReturnDate', type: 'text', label: 'Date you returned to work following the incident', showIf: 'hasLostIncome', rogRef: '8.5' },
          { id: 'incomeDatesNotWorked', type: 'textarea', label: 'Dates you did not work and for which you lost income', showIf: 'hasLostIncome', rogRef: '8.6' },
          { id: 'incomeTotalLost', type: 'text', label: 'Total income lost to date and how calculated', showIf: 'hasLostIncome', rogRef: '8.7' },
          { id: 'hasFutureIncomeLoss', type: 'yesno', label: 'Will you lose income in the future as a result of Dominick\'s death?', showIf: 'hasLostIncome', rogRef: '8.8' },
          { id: 'futureIncomeLoss', type: 'repeatable', label: 'Future income loss details', showIf: 'hasFutureIncomeLoss', rogRef: '8.8(a-d)', fields: [
            { id: 'facts', type: 'textarea', label: 'Facts on which you base this contention' },
            { id: 'estimatedAmount', type: 'text', label: 'Estimated amount' },
            { id: 'estimatedDuration', type: 'text', label: 'Estimated time you will be unable to work' },
            { id: 'calculation', type: 'textarea', label: 'How the claim for future income is calculated' }
          ]},
          { id: 'hasOtherDamages', type: 'yesno', label: 'Are there any other damages you attribute to Dominick\'s death not already described?', rogRef: '9.1' },
          { id: 'otherDamages', type: 'repeatable', label: 'Other damages', showIf: 'hasOtherDamages', rogRef: '9.1(a-d)', fields: [
            { id: 'nature', type: 'text', label: 'Nature of damage' },
            { id: 'date', type: 'text', label: 'Date it occurred' },
            { id: 'amount', type: 'text', label: 'Amount' },
            { id: 'obligee', type: 'textarea', label: 'Name, address, phone of person to whom obligation was incurred' }
          ]},
          { id: 'hasOtherDamagesDocs', type: 'yesno', label: 'Do any documents support the existence or amount of other damages claimed?', showIf: 'hasOtherDamages', rogRef: '9.2' },
          { id: 'otherDamagesDocs', type: 'repeatable', label: 'Documents supporting other damages', showIf: 'hasOtherDamagesDocs', rogRef: '9.2', fields: [
            { id: 'description', type: 'textarea', label: 'Description of document' },
            { id: 'whoHas', type: 'text', label: 'Name, address, phone of person who has it' }
          ]}
        ]
      },
      {
        id: 'medical-history',
        title: 'K. Your Medical History',
        description: 'These questions ask about your medical history before and after Dominick\'s death.',
        questions: [
          { id: 'hasRelevantMedicalHistory', type: 'yesno', label: 'Do you have any relevant medical history - prior complaints, disabilities, or injuries sustained after Dominick\'s death - that might relate to your current claims?', rogRef: '10.1-10.3' },
          { id: 'hadPriorComplaints', type: 'yesno', label: 'Before Dominick\'s death, did you have complaints or injuries involving the same part of your body or mental/emotional state now claimed as injured?', showIf: 'hasRelevantMedicalHistory', rogRef: '10.1' },
          { id: 'priorComplaints', type: 'repeatable', label: 'Prior complaints or injuries', showIf: 'hadPriorComplaints', rogRef: '10.1(a-c)', fields: [
            { id: 'description', type: 'textarea', label: 'Description of complaint or injury' },
            { id: 'dates', type: 'text', label: 'Dates it began and ended' },
            { id: 'provider', type: 'textarea', label: 'Healthcare provider name, address, phone' }
          ]},
          { id: 'hadPriorDisabilities', type: 'yesno', label: 'Did you have any physical, mental, or emotional disabilities immediately before Dominick\'s death?', showIf: 'hasRelevantMedicalHistory', rogRef: '10.2' },
          { id: 'priorDisabilities', type: 'textarea', label: 'List all disabilities you had before the incident', showIf: 'hadPriorDisabilities', rogRef: '10.2' },
          { id: 'hadSubsequentInjuries', type: 'yesno', label: 'After Dominick\'s death, have you sustained injuries of the kind for which you are now claiming damages (from other incidents)?', showIf: 'hasRelevantMedicalHistory', rogRef: '10.3' },
          { id: 'subsequentInjuries', type: 'repeatable', label: 'Subsequent injuries', showIf: 'hadSubsequentInjuries', rogRef: '10.3(a-e)', fields: [
            { id: 'datePlace', type: 'text', label: 'Date and place it occurred' },
            { id: 'otherPerson', type: 'text', label: 'Name, address, phone of any other person involved' },
            { id: 'injuryNature', type: 'textarea', label: 'Nature of injuries sustained' },
            { id: 'provider', type: 'textarea', label: 'Healthcare provider name, address, phone' },
            { id: 'treatment', type: 'text', label: 'Nature and duration of treatment' }
          ]}
        ]
      },
      {
        id: 'prior-claims',
        title: 'L. Prior Claims & Lawsuits',
        questions: [
          { id: 'hasPriorLawsuits', type: 'yesno', label: 'In the past 10 years, have you filed an action or made a written claim or demand for compensation for your personal injuries (other than this case)?', rogRef: '11.1' },
          { id: 'priorLawsuitsList', type: 'repeatable', label: 'Prior lawsuits/claims', showIf: 'hasPriorLawsuits', rogRef: '11.1(a-f)', fields: [
            { id: 'dateTimePlace', type: 'text', label: 'Date, time, place of incident giving rise to claim' },
            { id: 'personAgainst', type: 'textarea', label: 'Name, address, phone of person claim was made against' },
            { id: 'courtInfo', type: 'text', label: 'Court, names of parties, case number' },
            { id: 'attorney', type: 'text', label: 'Your attorney name, address, phone' },
            { id: 'status', type: 'text', label: 'Resolved or pending?' },
            { id: 'injuryDescription', type: 'textarea', label: 'Description of injury' }
          ]},
          { id: 'hasWorkersComp', type: 'yesno', label: 'In the past 10 years, have you made a written claim or demand for workers\' compensation benefits?', rogRef: '11.2' },
          { id: 'workersCompList', type: 'repeatable', label: 'Workers\' compensation claims', showIf: 'hasWorkersComp', rogRef: '11.2(a-g)', fields: [
            { id: 'dateTimePlace', type: 'text', label: 'Date, time, place of incident' },
            { id: 'employer', type: 'text', label: 'Employer name, address, phone' },
            { id: 'insurer', type: 'text', label: 'Workers\' comp insurer name, address, phone, claim number' },
            { id: 'benefitPeriod', type: 'text', label: 'Period you received benefits' },
            { id: 'injuryDescription', type: 'textarea', label: 'Description of injury' },
            { id: 'provider', type: 'textarea', label: 'Healthcare provider name, address, phone' },
            { id: 'wcabCaseNumber', type: 'text', label: 'WCAB case number' }
          ]}
        ]
      },
      {
        id: 'funeral-expenses',
        title: 'M. Funeral & Burial Expenses',
        questions: [
          { id: 'hasFuneralExpenses', type: 'yesno', label: 'Were there funeral and burial expenses?' },
          { id: 'funeralExpenses', type: 'repeatable', label: 'Funeral and burial expenses', showIf: 'hasFuneralExpenses', fields: [
            { id: 'expenseType', type: 'text', label: 'Type of expense' },
            { id: 'amount', type: 'text', label: 'Amount' },
            { id: 'paidBy', type: 'text', label: 'Paid by whom?' }
          ]},
          { id: 'hasOtherDeathExpenses', type: 'yesno', label: 'Are there any other expenses related to Dominick\'s death?' },
          { id: 'otherDeathExpensesList', type: 'repeatable', label: 'Other death-related expenses', showIf: 'hasOtherDeathExpenses', fields: [
            { id: 'expenseType', type: 'text', label: 'Type of expense' },
            { id: 'amount', type: 'text', label: 'Amount' },
            { id: 'description', type: 'text', label: 'Description' }
          ]}
        ]
      },
      {
        id: 'insurance',
        title: 'N. Insurance',
        questions: [
          { id: 'hasAnyInsuranceInfo', type: 'yesno', label: 'Do you have any insurance-related information relevant to this case (your insurance, self-insurance, or life insurance on Dominick)?', rogRef: '4.1-4.2' },
          { id: 'hadInsuranceCoverage', type: 'yesno', label: 'At the time of Dominick\'s death, did you have any insurance that might cover damages from this incident (liability, medical expense, etc.)?', showIf: 'hasAnyInsuranceInfo', rogRef: '4.1' },
          { id: 'insuranceCoverageList', type: 'repeatable', label: 'Insurance coverage', showIf: 'hadInsuranceCoverage', rogRef: '4.1', fields: [
            { id: 'coverageType', type: 'text', label: 'Type of coverage (liability, medical, etc.)' },
            { id: 'company', type: 'text', label: 'Insurance company' },
            { id: 'policyNumber', type: 'text', label: 'Policy number' },
            { id: 'coverageLimits', type: 'text', label: 'Coverage limits' }
          ]},
          { id: 'isSelfInsured', type: 'yesno', label: 'Are you self-insured under any statute for damages from this incident?', showIf: 'hasAnyInsuranceInfo', rogRef: '4.2' },
          { id: 'selfInsuredStatute', type: 'text', label: 'Specify the statute', showIf: 'isSelfInsured', rogRef: '4.2' },
          { id: 'wasLifeInsuranceBeneficiary', type: 'yesno', label: 'Was Dominick\'s life insured with you as a beneficiary?', showIf: 'hasAnyInsuranceInfo' },
          { id: 'lifeInsuranceList', type: 'repeatable', label: 'Life insurance policies', showIf: 'wasLifeInsuranceBeneficiary', fields: [
            { id: 'company', type: 'text', label: 'Insurance company' },
            { id: 'policyNumber', type: 'text', label: 'Policy number' },
            { id: 'coverageAmount', type: 'text', label: 'Coverage amount' },
            { id: 'receivedPayment', type: 'text', label: 'Have you received payment? (Yes/No/Pending)' }
          ]}
        ]
      },
      {
        id: 'investigation',
        title: 'O. Investigation & Evidence',
        description: 'These questions ask about witnesses, statements, photographs, and other evidence related to Dominick\'s death.',
        questions: [
          { id: 'hasAnyInvestigationInfo', type: 'yesno', label: 'Do you have any knowledge of witnesses, evidence, photographs, reports, or investigations related to this incident?', rogRef: '12.1-12.7' },
          { id: 'knowsWitnesses', type: 'yesno', label: 'Do you know of any individuals who witnessed the incident or events immediately before or after, or who have knowledge of the incident?', showIf: 'hasAnyInvestigationInfo', rogRef: '12.1' },
          { id: 'witnesses', type: 'repeatable', label: 'Witnesses', showIf: 'knowsWitnesses', rogRef: '12.1(a-d)', fields: [
            { id: 'name', type: 'text', label: 'Name' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'whatTheyKnow', type: 'textarea', label: 'What they witnessed or know' }
          ]},
          { id: 'conductedInterviews', type: 'yesno', label: 'Have you or anyone on your behalf interviewed any individual concerning the incident?', showIf: 'hasAnyInvestigationInfo', rogRef: '12.2' },
          { id: 'interviews', type: 'repeatable', label: 'Interviews conducted', showIf: 'conductedInterviews', rogRef: '12.2(a-c)', fields: [
            { id: 'intervieweeName', type: 'text', label: 'Name of person interviewed' },
            { id: 'intervieweeAddress', type: 'text', label: 'Address and phone' },
            { id: 'date', type: 'text', label: 'Date of interview' },
            { id: 'interviewer', type: 'text', label: 'Name, address, phone of person who conducted interview' }
          ]},
          { id: 'obtainedStatements', type: 'yesno', label: 'Have you or anyone on your behalf obtained a written or recorded statement from any individual concerning the incident?', showIf: 'hasAnyInvestigationInfo', rogRef: '12.3' },
          { id: 'statements', type: 'repeatable', label: 'Statements obtained', showIf: 'obtainedStatements', rogRef: '12.3(a-d)', fields: [
            { id: 'personName', type: 'text', label: 'Name of person who gave statement' },
            { id: 'personAddress', type: 'text', label: 'Address and phone' },
            { id: 'obtainer', type: 'text', label: 'Name, address, phone of person who obtained statement' },
            { id: 'date', type: 'text', label: 'Date obtained' },
            { id: 'whoHas', type: 'text', label: 'Who has the original or a copy (name, address, phone)' }
          ]},
          { id: 'hasPhotosVideos', type: 'yesno', label: 'Do you know of any photographs, films, or videotapes depicting any place, object, or individual concerning the incident or injuries?', showIf: 'hasAnyInvestigationInfo', rogRef: '12.4' },
          { id: 'photosVideos', type: 'repeatable', label: 'Photographs/films/videotapes', showIf: 'hasPhotosVideos', rogRef: '12.4(a-e)', fields: [
            { id: 'quantity', type: 'text', label: 'Number of photos or length of film/video' },
            { id: 'subjects', type: 'textarea', label: 'What/who is depicted' },
            { id: 'dateTaken', type: 'text', label: 'Date taken' },
            { id: 'takenBy', type: 'text', label: 'Name, address, phone of person who took them' },
            { id: 'whoHas', type: 'text', label: 'Who has originals or copies (name, address, phone)' }
          ]},
          { id: 'hasDiagrams', type: 'yesno', label: 'Do you know of any diagram, reproduction, or model of any place or thing concerning the incident?', showIf: 'hasAnyInvestigationInfo', rogRef: '12.5' },
          { id: 'diagrams', type: 'repeatable', label: 'Diagrams/reproductions/models', showIf: 'hasDiagrams', rogRef: '12.5(a-c)', fields: [
            { id: 'type', type: 'text', label: 'Type (diagram, reproduction, model)' },
            { id: 'subject', type: 'text', label: 'Subject matter' },
            { id: 'whoHas', type: 'text', label: 'Name, address, phone of person who has it' }
          ]},
          { id: 'hasReports', type: 'yesno', label: 'Was a report made by any person concerning the incident?', showIf: 'hasAnyInvestigationInfo', rogRef: '12.6' },
          { id: 'reports', type: 'repeatable', label: 'Reports made', showIf: 'hasReports', rogRef: '12.6(a-d)', fields: [
            { id: 'reporterName', type: 'text', label: 'Name, title, ID number, employer of person who made report' },
            { id: 'dateType', type: 'text', label: 'Date and type of report' },
            { id: 'madeFor', type: 'text', label: 'Name, address, phone of person for whom report was made' },
            { id: 'whoHas', type: 'text', label: 'Who has original or copy (name, address, phone)' }
          ]},
          { id: 'inspectedScene', type: 'yesno', label: 'Have you or anyone on your behalf inspected the scene of the incident?', showIf: 'hasAnyInvestigationInfo', rogRef: '12.7' },
          { id: 'sceneInspections', type: 'repeatable', label: 'Scene inspections', showIf: 'inspectedScene', rogRef: '12.7(a-b)', fields: [
            { id: 'inspectorName', type: 'text', label: 'Name of person who inspected' },
            { id: 'inspectorAddress', type: 'text', label: 'Address and phone' },
            { id: 'date', type: 'text', label: 'Date of inspection' }
          ]},
          { id: 'conductedSurveillance', type: 'yesno', label: 'Have you or anyone on your behalf conducted surveillance of any individual involved in the incident or any party to this action?', showIf: 'hasAnyInvestigationInfo', rogRef: '13.1' },
          { id: 'surveillance', type: 'repeatable', label: 'Surveillance conducted', showIf: 'conductedSurveillance', rogRef: '13.1(a-d)', fields: [
            { id: 'subjectName', type: 'text', label: 'Name, address, phone of person surveilled' },
            { id: 'dateTimePlace', type: 'text', label: 'Date, time, place of surveillance' },
            { id: 'conductedBy', type: 'text', label: 'Name, address, phone of person who conducted it' },
            { id: 'whoHasMaterials', type: 'text', label: 'Who has photos/films/videos (name, address, phone)' }
          ]},
          { id: 'hasSurveillanceReport', type: 'yesno', label: 'Has a written report been prepared on any surveillance?', showIf: 'conductedSurveillance', rogRef: '13.2' },
          { id: 'surveillanceReports', type: 'repeatable', label: 'Surveillance reports', showIf: 'hasSurveillanceReport', rogRef: '13.2(a-d)', fields: [
            { id: 'title', type: 'text', label: 'Title' },
            { id: 'date', type: 'text', label: 'Date' },
            { id: 'preparer', type: 'text', label: 'Name, address, phone of person who prepared it' },
            { id: 'whoHas', type: 'text', label: 'Who has original or copy (name, address, phone)' }
          ]}
        ]
      },
      {
        id: 'statutory-violations',
        title: 'P. Statutory & Regulatory Violations',
        questions: [
          { id: 'hasStatutoryInfo', type: 'yesno', label: 'Do you have any knowledge about statutory or regulatory violations, or citations/charges issued, related to this incident?', rogRef: '14.1-14.2' },
          { id: 'contendViolation', type: 'yesno', label: 'Do you contend that any person involved in the incident violated any statute, ordinance, or regulation that was a legal cause of the incident?', showIf: 'hasStatutoryInfo', rogRef: '14.1' },
          { id: 'violationContention', type: 'repeatable', label: 'Violations contended', showIf: 'contendViolation', rogRef: '14.1', fields: [
            { id: 'personName', type: 'text', label: 'Name of person' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone' },
            { id: 'statuteViolated', type: 'textarea', label: 'Statute, ordinance, or regulation violated' }
          ]},
          { id: 'wasCited', type: 'yesno', label: 'Was any person cited or charged with a violation of any statute, ordinance, or regulation as a result of this incident?', showIf: 'hasStatutoryInfo', rogRef: '14.2' },
          { id: 'citations', type: 'repeatable', label: 'Citations/charges', showIf: 'wasCited', rogRef: '14.2(a-d)', fields: [
            { id: 'personName', type: 'text', label: 'Name of person' },
            { id: 'address', type: 'text', label: 'Address and phone' },
            { id: 'statuteViolated', type: 'text', label: 'Statute, ordinance, or regulation allegedly violated' },
            { id: 'plea', type: 'text', label: 'Plea entered (if any)' },
            { id: 'courtInfo', type: 'text', label: 'Court/agency name, address, parties, case number' }
          ]}
        ]
      },
      {
        id: 'documents-checklist',
        title: 'Q. Documents Checklist',
        description: 'Please check all documents you have access to and can provide. This helps us know what evidence we can use to support your case.',
        questions: [
          { id: 'docs_identity', type: 'checklist', label: 'Identity & Relationship Documents', options: [
            { id: 'yourBirthCertificate', label: 'Your birth certificate' },
            { id: 'dominickBirthCertificate', label: 'Dominick\'s birth certificate (showing you as parent)' },
            { id: 'driversLicense', label: 'Your driver\'s license or state ID' }
          ]},
          { id: 'docs_financial', type: 'checklist', label: 'Financial Documents', options: [
            { id: 'bankStatements', label: 'Bank statements showing support from Dominick' },
            { id: 'receipts', label: 'Receipts for items Dominick purchased for you' },
            { id: 'taxReturns', label: 'Tax returns' }
          ]},
          { id: 'docs_insurance', type: 'checklist', label: 'Insurance Documents', options: [
            { id: 'lifeInsurancePolicies', label: 'Life insurance policies naming you as beneficiary' },
            { id: 'otherInsuranceDocs', label: 'Other insurance documents' }
          ]},
          { id: 'docs_medical', type: 'checklist', label: 'Medical Documents', options: [
            { id: 'dominickMedicalRecords', label: 'Dominick\'s medical records' },
            { id: 'yourCounselingRecords', label: 'Your grief counseling or therapy records' }
          ]},
          { id: 'docs_funeral', type: 'checklist', label: 'Funeral & Death Documents', options: [
            { id: 'deathCertificate', label: 'Dominick\'s death certificate' },
            { id: 'funeralInvoice', label: 'Funeral home invoice' },
            { id: 'coronerReport', label: 'Coroner/medical examiner report' },
            { id: 'otherFuneralExpenses', label: 'Other funeral expense receipts' }
          ]},
          { id: 'docs_relationship', type: 'checklist', label: 'Relationship Evidence', options: [
            { id: 'photos', label: 'Photographs of you with Dominick' },
            { id: 'cardsLetters', label: 'Cards, letters, or written communications from Dominick' },
            { id: 'textMessages', label: 'Text messages or social media communications' },
            { id: 'videos', label: 'Videos of you with Dominick' }
          ]},
          { id: 'docs_dominick', type: 'checklist', label: 'Dominick\'s Records', options: [
            { id: 'dominickEducationRecords', label: 'Dominick\'s education records or diplomas' },
            { id: 'dominickEmploymentRecords', label: 'Dominick\'s employment records' },
            { id: 'dominickTaxReturns', label: 'Dominick\'s tax returns' }
          ]}
        ]
      },
      {
        id: 'final-questions',
        title: 'R. Final Questions',
        questions: [
          { id: 'responsePrepHelpers', type: 'repeatable', label: 'Who helped you prepare these responses? (List each person who prepared or assisted)', rogRef: '1.1', fields: [
            { id: 'name', type: 'text', label: 'Name' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'relationship', type: 'text', label: 'Relationship to you' }
          ]},
          { id: 'anythingElse', type: 'textarea', label: 'Is there anything else you think is relevant to this case that we haven\'t asked about?' },
          { id: 'unableToLocate', type: 'textarea', label: 'Are there any documents you are unable to locate? If so, which ones and why?' },
          { id: 'additionalNotes', type: 'textarea', label: 'Any additional notes or messages for your attorney' }
        ]
      }
    ]
  },
  'alvarado-watkins': {
    clientName: 'Olivia Watkins (Guardian Ad Litem)',
    caseName: 'Alvarado v. State of California, et al.',
    caseNumber: '25STCV35294',
    decedent: 'Dominick Alvarado',
    decedentDOD: 'July 21, 2023',
    deadline: 'January 26, 2026',
    passwordPrefix: 'Watkins',
    dropboxLink: 'https://www.dropbox.com/request/9hnjYKu87tKg0a8T8FD8',
    sections: [
      {
        id: 'gal-info',
        title: 'A. Guardian Ad Litem Information',
        description: 'As the Guardian Ad Litem, please provide your own contact information first.',
        questions: [
          { id: 'galNameDisplay', type: 'static', label: 'Your name as it appears in court records:', value: 'Olivia Watkins' },
          { id: 'galNameNeedsCorrection', type: 'yesno', label: 'Does the spelling of your name need to be corrected?' },
          { id: 'galCorrectedName', type: 'text', label: 'Please provide the correct spelling of your name', showIf: 'galNameNeedsCorrection' },
          { id: 'galAddress', type: 'textarea', label: 'Your current address (street, city, state, zip)' },
          { id: 'galPhone', type: 'text', label: 'Your phone number' },
          { id: 'galEmail', type: 'text', label: 'Your email address' },
          { id: 'galRelationship', type: 'text', label: 'Your relationship to the children', placeholder: 'e.g., grandmother, aunt, family friend' }
        ]
      },
      {
        id: 'child-adam',
        title: 'B. Adam Ryden Alvarado - Basic Information',
        description: 'Please provide the following information for Adam Ryden Alvarado.',
        questions: [
          { id: 'adam_nameDisplay', type: 'static', label: 'Name as it appears in court records:', value: 'Adam Ryden Alvarado' },
          { id: 'adam_nameNeedsCorrection', type: 'yesno', label: 'Does the spelling of Adam\'s name need to be corrected?' },
          { id: 'adam_correctedName', type: 'text', label: 'Please provide the correct spelling of Adam\'s name', showIf: 'adam_nameNeedsCorrection' },
          { id: 'adam_dateOfBirth', type: 'date', label: 'Date of birth', rogRef: '2.2' },
          { id: 'adam_placeOfBirth', type: 'text', label: 'Place of birth (city, state, country)', rogRef: '2.2' },
          { id: 'adam_currentAddress', type: 'textarea', label: 'Current address (street, city, state, zip)', rogRef: '2.5(a)' },
          { id: 'adam_biologicalMother', type: 'text', label: 'Full name of Adam\'s biological mother', rogRef: 'SI-1' },
          { id: 'adam_biologicalMotherAddress', type: 'textarea', label: 'Biological mother\'s address', rogRef: 'SI-1' },
          { id: 'adam_biologicalMotherPhone', type: 'text', label: 'Biological mother\'s phone number', rogRef: 'SI-1' },
          { id: 'adam_biologicalMotherEmail', type: 'text', label: 'Biological mother\'s email address', rogRef: 'SI-1' },
          { id: 'adam_isDominickBiologicalFather', type: 'yesno', label: 'Is Dominick Alvarado Adam\'s biological father?', rogRef: 'SI-7' },
          { id: 'adam_biologicalFatherFacts', type: 'textarea', label: 'State all facts that support Adam being Dominick\'s natural child', rogRef: 'SI-11' },
          { id: 'adam_hasBeenAdopted', type: 'yesno', label: 'Has Adam ever been adopted?', rogRef: 'SI-10' },
          { id: 'adam_adoptionDetails', type: 'repeatable', label: 'Adoption details', showIf: 'adam_hasBeenAdopted', rogRef: 'SI-10', fields: [
            { id: 'name', type: 'text', label: 'Name of adopting person' },
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'adoptionDate', type: 'date', label: 'Date of adoption' }
          ]},
          { id: 'adam_parentalRightsTerminated', type: 'yesno', label: 'Were Dominick\'s parental rights over Adam ever terminated or limited?', rogRef: 'SI-8' },
          { id: 'adam_parentalRightsDates', type: 'textarea', label: 'If yes, state the dates when those rights were terminated or limited', showIf: 'adam_parentalRightsTerminated', rogRef: 'SI-8' },
          { id: 'adam_custodialRightsTerminated', type: 'yesno', label: 'Were Dominick\'s custodial rights over Adam ever terminated or limited?', rogRef: 'SI-9' },
          { id: 'adam_custodialRightsDates', type: 'textarea', label: 'If yes, state the dates when those rights were terminated or limited', showIf: 'adam_custodialRightsTerminated', rogRef: 'SI-9' },
          { id: 'adam_hasCourtProceedings', type: 'yesno', label: 'Have there been any court proceedings relating to Adam (custody, dependency, etc.)?', rogRef: 'SI-17' },
          { id: 'adam_courtProceedings', type: 'repeatable', label: 'Court proceedings', showIf: 'adam_hasCourtProceedings', rogRef: 'SI-17', fields: [
            { id: 'venue', type: 'text', label: 'Court venue (county and state)' },
            { id: 'caseNumber', type: 'text', label: 'Case number' },
            { id: 'description', type: 'text', label: 'Description of proceeding' }
          ]},
          { id: 'adam_hasAttendedSchool', type: 'yesno', label: 'Has Adam attended any schools?', rogRef: 'SI-2' },
          { id: 'adam_schools', type: 'repeatable', label: 'Schools attended', showIf: 'adam_hasAttendedSchool', rogRef: 'SI-2', fields: [
            { id: 'name', type: 'text', label: 'School name' },
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'datesAttended', type: 'text', label: 'Dates attended' }
          ]}
        ]
      },
      {
        id: 'child-adalynn',
        title: 'C. Adalynn Nadine Alvarado - Basic Information',
        description: 'Please provide the following information for Adalynn Nadine Alvarado.',
        questions: [
          { id: 'adalynn_nameDisplay', type: 'static', label: 'Name as it appears in court records:', value: 'Adalynn Nadine Alvarado' },
          { id: 'adalynn_nameNeedsCorrection', type: 'yesno', label: 'Does the spelling of Adalynn\'s name need to be corrected?' },
          { id: 'adalynn_correctedName', type: 'text', label: 'Please provide the correct spelling of Adalynn\'s name', showIf: 'adalynn_nameNeedsCorrection' },
          { id: 'adalynn_dateOfBirth', type: 'date', label: 'Date of birth', rogRef: '2.2' },
          { id: 'adalynn_placeOfBirth', type: 'text', label: 'Place of birth (city, state, country)', rogRef: '2.2' },
          { id: 'adalynn_currentAddress', type: 'textarea', label: 'Current address (street, city, state, zip)', rogRef: '2.5(a)' },
          { id: 'adalynn_biologicalMother', type: 'text', label: 'Full name of Adalynn\'s biological mother', rogRef: 'SI-1' },
          { id: 'adalynn_biologicalMotherAddress', type: 'textarea', label: 'Biological mother\'s address', rogRef: 'SI-1' },
          { id: 'adalynn_biologicalMotherPhone', type: 'text', label: 'Biological mother\'s phone number', rogRef: 'SI-1' },
          { id: 'adalynn_biologicalMotherEmail', type: 'text', label: 'Biological mother\'s email address', rogRef: 'SI-1' },
          { id: 'adalynn_isDominickBiologicalFather', type: 'yesno', label: 'Is Dominick Alvarado Adalynn\'s biological father?', rogRef: 'SI-7' },
          { id: 'adalynn_biologicalFatherFacts', type: 'textarea', label: 'State all facts that support Adalynn being Dominick\'s natural child', rogRef: 'SI-11' },
          { id: 'adalynn_hasBeenAdopted', type: 'yesno', label: 'Has Adalynn ever been adopted?', rogRef: 'SI-10' },
          { id: 'adalynn_adoptionDetails', type: 'repeatable', label: 'Adoption details', showIf: 'adalynn_hasBeenAdopted', rogRef: 'SI-10', fields: [
            { id: 'name', type: 'text', label: 'Name of adopting person' },
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'adoptionDate', type: 'date', label: 'Date of adoption' }
          ]},
          { id: 'adalynn_parentalRightsTerminated', type: 'yesno', label: 'Were Dominick\'s parental rights over Adalynn ever terminated or limited?', rogRef: 'SI-8' },
          { id: 'adalynn_parentalRightsDates', type: 'textarea', label: 'If yes, state the dates when those rights were terminated or limited', showIf: 'adalynn_parentalRightsTerminated', rogRef: 'SI-8' },
          { id: 'adalynn_custodialRightsTerminated', type: 'yesno', label: 'Were Dominick\'s custodial rights over Adalynn ever terminated or limited?', rogRef: 'SI-9' },
          { id: 'adalynn_custodialRightsDates', type: 'textarea', label: 'If yes, state the dates when those rights were terminated or limited', showIf: 'adalynn_custodialRightsTerminated', rogRef: 'SI-9' },
          { id: 'adalynn_hasCourtProceedings', type: 'yesno', label: 'Have there been any court proceedings relating to Adalynn (custody, dependency, etc.)?', rogRef: 'SI-17' },
          { id: 'adalynn_courtProceedings', type: 'repeatable', label: 'Court proceedings', showIf: 'adalynn_hasCourtProceedings', rogRef: 'SI-17', fields: [
            { id: 'venue', type: 'text', label: 'Court venue (county and state)' },
            { id: 'caseNumber', type: 'text', label: 'Case number' },
            { id: 'description', type: 'text', label: 'Description of proceeding' }
          ]},
          { id: 'adalynn_hasAttendedSchool', type: 'yesno', label: 'Has Adalynn attended any schools?', rogRef: 'SI-2' },
          { id: 'adalynn_schools', type: 'repeatable', label: 'Schools attended', showIf: 'adalynn_hasAttendedSchool', rogRef: 'SI-2', fields: [
            { id: 'name', type: 'text', label: 'School name' },
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'datesAttended', type: 'text', label: 'Dates attended' }
          ]}
        ]
      },
      {
        id: 'child-xzavier',
        title: 'D. Xzavier Rydge Alvarado - Basic Information',
        description: 'Please provide the following information for Xzavier Rydge Alvarado.',
        questions: [
          { id: 'xzavier_nameDisplay', type: 'static', label: 'Name as it appears in court records:', value: 'Xzavier Rydge Alvarado' },
          { id: 'xzavier_nameNeedsCorrection', type: 'yesno', label: 'Does the spelling of Xzavier\'s name need to be corrected?' },
          { id: 'xzavier_correctedName', type: 'text', label: 'Please provide the correct spelling of Xzavier\'s name', showIf: 'xzavier_nameNeedsCorrection' },
          { id: 'xzavier_dateOfBirth', type: 'date', label: 'Date of birth', rogRef: '2.2' },
          { id: 'xzavier_placeOfBirth', type: 'text', label: 'Place of birth (city, state, country)', rogRef: '2.2' },
          { id: 'xzavier_currentAddress', type: 'textarea', label: 'Current address (street, city, state, zip)', rogRef: '2.5(a)' },
          { id: 'xzavier_biologicalMother', type: 'text', label: 'Full name of Xzavier\'s biological mother', rogRef: 'SI-1' },
          { id: 'xzavier_biologicalMotherAddress', type: 'textarea', label: 'Biological mother\'s address', rogRef: 'SI-1' },
          { id: 'xzavier_biologicalMotherPhone', type: 'text', label: 'Biological mother\'s phone number', rogRef: 'SI-1' },
          { id: 'xzavier_biologicalMotherEmail', type: 'text', label: 'Biological mother\'s email address', rogRef: 'SI-1' },
          { id: 'xzavier_isDominickBiologicalFather', type: 'yesno', label: 'Is Dominick Alvarado Xzavier\'s biological father?', rogRef: 'SI-7' },
          { id: 'xzavier_biologicalFatherFacts', type: 'textarea', label: 'State all facts that support Xzavier being Dominick\'s natural child', rogRef: 'SI-11' },
          { id: 'xzavier_hasBeenAdopted', type: 'yesno', label: 'Has Xzavier ever been adopted?', rogRef: 'SI-10' },
          { id: 'xzavier_adoptionDetails', type: 'repeatable', label: 'Adoption details', showIf: 'xzavier_hasBeenAdopted', rogRef: 'SI-10', fields: [
            { id: 'name', type: 'text', label: 'Name of adopting person' },
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'adoptionDate', type: 'date', label: 'Date of adoption' }
          ]},
          { id: 'xzavier_parentalRightsTerminated', type: 'yesno', label: 'Were Dominick\'s parental rights over Xzavier ever terminated or limited?', rogRef: 'SI-8' },
          { id: 'xzavier_parentalRightsDates', type: 'textarea', label: 'If yes, state the dates when those rights were terminated or limited', showIf: 'xzavier_parentalRightsTerminated', rogRef: 'SI-8' },
          { id: 'xzavier_custodialRightsTerminated', type: 'yesno', label: 'Were Dominick\'s custodial rights over Xzavier ever terminated or limited?', rogRef: 'SI-9' },
          { id: 'xzavier_custodialRightsDates', type: 'textarea', label: 'If yes, state the dates when those rights were terminated or limited', showIf: 'xzavier_custodialRightsTerminated', rogRef: 'SI-9' },
          { id: 'xzavier_hasCourtProceedings', type: 'yesno', label: 'Have there been any court proceedings relating to Xzavier (custody, dependency, etc.)?', rogRef: 'SI-17' },
          { id: 'xzavier_courtProceedings', type: 'repeatable', label: 'Court proceedings', showIf: 'xzavier_hasCourtProceedings', rogRef: 'SI-17', fields: [
            { id: 'venue', type: 'text', label: 'Court venue (county and state)' },
            { id: 'caseNumber', type: 'text', label: 'Case number' },
            { id: 'description', type: 'text', label: 'Description of proceeding' }
          ]},
          { id: 'xzavier_hasAttendedSchool', type: 'yesno', label: 'Has Xzavier attended any schools?', rogRef: 'SI-2' },
          { id: 'xzavier_schools', type: 'repeatable', label: 'Schools attended', showIf: 'xzavier_hasAttendedSchool', rogRef: 'SI-2', fields: [
            { id: 'name', type: 'text', label: 'School name' },
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'datesAttended', type: 'text', label: 'Dates attended' }
          ]}
        ]
      },
      {
        id: 'child-noah',
        title: 'E. Noah Rylan Alvarado - Basic Information',
        description: 'Please provide the following information for Noah Rylan Alvarado.',
        questions: [
          { id: 'noah_nameDisplay', type: 'static', label: 'Name as it appears in court records:', value: 'Noah Rylan Alvarado' },
          { id: 'noah_nameNeedsCorrection', type: 'yesno', label: 'Does the spelling of Noah\'s name need to be corrected?' },
          { id: 'noah_correctedName', type: 'text', label: 'Please provide the correct spelling of Noah\'s name', showIf: 'noah_nameNeedsCorrection' },
          { id: 'noah_dateOfBirth', type: 'date', label: 'Date of birth', rogRef: '2.2' },
          { id: 'noah_placeOfBirth', type: 'text', label: 'Place of birth (city, state, country)', rogRef: '2.2' },
          { id: 'noah_currentAddress', type: 'textarea', label: 'Current address (street, city, state, zip)', rogRef: '2.5(a)' },
          { id: 'noah_biologicalMother', type: 'text', label: 'Full name of Noah\'s biological mother', rogRef: 'SI-1' },
          { id: 'noah_biologicalMotherAddress', type: 'textarea', label: 'Biological mother\'s address', rogRef: 'SI-1' },
          { id: 'noah_biologicalMotherPhone', type: 'text', label: 'Biological mother\'s phone number', rogRef: 'SI-1' },
          { id: 'noah_biologicalMotherEmail', type: 'text', label: 'Biological mother\'s email address', rogRef: 'SI-1' },
          { id: 'noah_isDominickBiologicalFather', type: 'yesno', label: 'Is Dominick Alvarado Noah\'s biological father?', rogRef: 'SI-7' },
          { id: 'noah_biologicalFatherFacts', type: 'textarea', label: 'State all facts that support Noah being Dominick\'s natural child', rogRef: 'SI-11' },
          { id: 'noah_hasBeenAdopted', type: 'yesno', label: 'Has Noah ever been adopted?', rogRef: 'SI-10' },
          { id: 'noah_adoptionDetails', type: 'repeatable', label: 'Adoption details', showIf: 'noah_hasBeenAdopted', rogRef: 'SI-10', fields: [
            { id: 'name', type: 'text', label: 'Name of adopting person' },
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'adoptionDate', type: 'date', label: 'Date of adoption' }
          ]},
          { id: 'noah_parentalRightsTerminated', type: 'yesno', label: 'Were Dominick\'s parental rights over Noah ever terminated or limited?', rogRef: 'SI-8' },
          { id: 'noah_parentalRightsDates', type: 'textarea', label: 'If yes, state the dates when those rights were terminated or limited', showIf: 'noah_parentalRightsTerminated', rogRef: 'SI-8' },
          { id: 'noah_custodialRightsTerminated', type: 'yesno', label: 'Were Dominick\'s custodial rights over Noah ever terminated or limited?', rogRef: 'SI-9' },
          { id: 'noah_custodialRightsDates', type: 'textarea', label: 'If yes, state the dates when those rights were terminated or limited', showIf: 'noah_custodialRightsTerminated', rogRef: 'SI-9' },
          { id: 'noah_hasCourtProceedings', type: 'yesno', label: 'Have there been any court proceedings relating to Noah (custody, dependency, etc.)?', rogRef: 'SI-17' },
          { id: 'noah_courtProceedings', type: 'repeatable', label: 'Court proceedings', showIf: 'noah_hasCourtProceedings', rogRef: 'SI-17', fields: [
            { id: 'venue', type: 'text', label: 'Court venue (county and state)' },
            { id: 'caseNumber', type: 'text', label: 'Case number' },
            { id: 'description', type: 'text', label: 'Description of proceeding' }
          ]},
          { id: 'noah_hasAttendedSchool', type: 'yesno', label: 'Has Noah attended any schools?', rogRef: 'SI-2' },
          { id: 'noah_schools', type: 'repeatable', label: 'Schools attended', showIf: 'noah_hasAttendedSchool', rogRef: 'SI-2', fields: [
            { id: 'name', type: 'text', label: 'School name' },
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'datesAttended', type: 'text', label: 'Dates attended' }
          ]}
        ]
      },
      {
        id: 'child-nathan',
        title: 'F. Nathan Ryan Alvarado - Basic Information',
        description: 'Please provide the following information for Nathan Ryan Alvarado.',
        questions: [
          { id: 'nathan_nameDisplay', type: 'static', label: 'Name as it appears in court records:', value: 'Nathan Ryan Alvarado' },
          { id: 'nathan_nameNeedsCorrection', type: 'yesno', label: 'Does the spelling of Nathan\'s name need to be corrected?' },
          { id: 'nathan_correctedName', type: 'text', label: 'Please provide the correct spelling of Nathan\'s name', showIf: 'nathan_nameNeedsCorrection' },
          { id: 'nathan_dateOfBirth', type: 'date', label: 'Date of birth', rogRef: '2.2' },
          { id: 'nathan_placeOfBirth', type: 'text', label: 'Place of birth (city, state, country)', rogRef: '2.2' },
          { id: 'nathan_currentAddress', type: 'textarea', label: 'Current address (street, city, state, zip)', rogRef: '2.5(a)' },
          { id: 'nathan_biologicalMother', type: 'text', label: 'Full name of Nathan\'s biological mother', rogRef: 'SI-1' },
          { id: 'nathan_biologicalMotherAddress', type: 'textarea', label: 'Biological mother\'s address', rogRef: 'SI-1' },
          { id: 'nathan_biologicalMotherPhone', type: 'text', label: 'Biological mother\'s phone number', rogRef: 'SI-1' },
          { id: 'nathan_biologicalMotherEmail', type: 'text', label: 'Biological mother\'s email address', rogRef: 'SI-1' },
          { id: 'nathan_isDominickBiologicalFather', type: 'yesno', label: 'Is Dominick Alvarado Nathan\'s biological father?', rogRef: 'SI-7' },
          { id: 'nathan_biologicalFatherFacts', type: 'textarea', label: 'State all facts that support Nathan being Dominick\'s natural child', rogRef: 'SI-11' },
          { id: 'nathan_hasBeenAdopted', type: 'yesno', label: 'Has Nathan ever been adopted?', rogRef: 'SI-10' },
          { id: 'nathan_adoptionDetails', type: 'repeatable', label: 'Adoption details', showIf: 'nathan_hasBeenAdopted', rogRef: 'SI-10', fields: [
            { id: 'name', type: 'text', label: 'Name of adopting person' },
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'adoptionDate', type: 'date', label: 'Date of adoption' }
          ]},
          { id: 'nathan_parentalRightsTerminated', type: 'yesno', label: 'Were Dominick\'s parental rights over Nathan ever terminated or limited?', rogRef: 'SI-8' },
          { id: 'nathan_parentalRightsDates', type: 'textarea', label: 'If yes, state the dates when those rights were terminated or limited', showIf: 'nathan_parentalRightsTerminated', rogRef: 'SI-8' },
          { id: 'nathan_custodialRightsTerminated', type: 'yesno', label: 'Were Dominick\'s custodial rights over Nathan ever terminated or limited?', rogRef: 'SI-9' },
          { id: 'nathan_custodialRightsDates', type: 'textarea', label: 'If yes, state the dates when those rights were terminated or limited', showIf: 'nathan_custodialRightsTerminated', rogRef: 'SI-9' },
          { id: 'nathan_hasCourtProceedings', type: 'yesno', label: 'Have there been any court proceedings relating to Nathan (custody, dependency, etc.)?', rogRef: 'SI-17' },
          { id: 'nathan_courtProceedings', type: 'repeatable', label: 'Court proceedings', showIf: 'nathan_hasCourtProceedings', rogRef: 'SI-17', fields: [
            { id: 'venue', type: 'text', label: 'Court venue (county and state)' },
            { id: 'caseNumber', type: 'text', label: 'Case number' },
            { id: 'description', type: 'text', label: 'Description of proceeding' }
          ]},
          { id: 'nathan_hasAttendedSchool', type: 'yesno', label: 'Has Nathan attended any schools?', rogRef: 'SI-2' },
          { id: 'nathan_schools', type: 'repeatable', label: 'Schools attended', showIf: 'nathan_hasAttendedSchool', rogRef: 'SI-2', fields: [
            { id: 'name', type: 'text', label: 'School name' },
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'datesAttended', type: 'text', label: 'Dates attended' }
          ]}
        ]
      },
      {
        id: 'living-with-dominick',
        title: 'G. Children Living with Dominick',
        description: 'These questions ask about the periods when the children lived with Dominick. You may answer for all children together if they lived with him during the same periods.',
        questions: [
          { id: 'childrenLivedWithDominick', type: 'yesno', label: 'Did any of the children ever live with Dominick?', rogRef: 'SI-5' },
          { id: 'livingPeriods', type: 'repeatable', label: 'Periods living with Dominick', showIf: 'childrenLivedWithDominick', rogRef: 'SI-5,SI-6', fields: [
            { id: 'children', type: 'text', label: 'Which children lived with Dominick during this period? (List names)' },
            { id: 'address', type: 'textarea', label: 'Address where they lived together' },
            { id: 'dateFrom', type: 'text', label: 'From date' },
            { id: 'dateTo', type: 'text', label: 'To date' }
          ]},
          { id: 'othersLivedWith', type: 'repeatable', label: 'Other people who lived with Dominick and the children', showIf: 'childrenLivedWithDominick', rogRef: 'SI-6', fields: [
            { id: 'name', type: 'text', label: 'Name' },
            { id: 'address', type: 'textarea', label: 'Current address (if known)' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'relationship', type: 'text', label: 'Relationship to Dominick/children' },
            { id: 'dates', type: 'text', label: 'Dates they lived together' }
          ]}
        ]
      },
      {
        id: 'relationship-combined',
        title: 'H. Children\'s Relationship with Dominick',
        description: 'These questions ask about all the children\'s relationship with their father Dominick. You may answer for all children together.',
        questions: [
          { id: 'activitiesTogether', type: 'textarea', label: 'Describe the activities that the children and Dominick enjoyed doing together as father and children', rogRef: 'SI-12' },
          { id: 'communicationFrequency', type: 'text', label: 'How frequently did the children see Dominick in the 5 years before his death?', rogRef: 'SI-13', placeholder: 'e.g., daily, weekly, monthly, rarely' },
          { id: 'approximateVisits', type: 'text', label: 'Approximately how many times did the children see Dominick in the 5 years before his death?', rogRef: 'SI-13' },
          { id: 'phoneCallFrequency', type: 'text', label: 'How many times did the children speak to Dominick on the phone in the 5 years before his death?', rogRef: 'SI-14' },
          { id: 'writtenCommunication', type: 'text', label: 'How many times did the children and Dominick communicate in writing (text, email, cards, letters) in the 5 years before his death?', rogRef: 'SI-15' },
          { id: 'communicationMethods', type: 'multiselect', label: 'How did the children communicate with Dominick? (Select all that apply)', options: ['Phone calls', 'Text messages', 'In person', 'Video calls', 'Social media', 'Cards/Letters'] },
          { id: 'relationshipDescription', type: 'textarea', label: 'Describe the bond and relationship the children had with Dominick. What made their relationship special?' },
          { id: 'majorLifeEvents', type: 'yesno', label: 'Did Dominick participate in major life events with the children (birthdays, holidays, school events, etc.)?' },
          { id: 'majorLifeEventsList', type: 'repeatable', label: 'Major life events with Dominick', showIf: 'majorLifeEvents', fields: [
            { id: 'event', type: 'text', label: 'Event type (birthday, holiday, school event, etc.)' },
            { id: 'date', type: 'text', label: 'Approximate date' },
            { id: 'children', type: 'text', label: 'Which children attended?' },
            { id: 'description', type: 'text', label: 'Description of Dominick\'s participation' }
          ]},
          { id: 'hadVacations', type: 'yesno', label: 'Did the children take any vacations or trips with Dominick?' },
          { id: 'vacationDetails', type: 'repeatable', label: 'Vacations/trips with Dominick', showIf: 'hadVacations', fields: [
            { id: 'location', type: 'text', label: 'Location' },
            { id: 'dates', type: 'text', label: 'Dates' },
            { id: 'children', type: 'text', label: 'Which children went?' }
          ]}
        ]
      },
      {
        id: 'financial-support',
        title: 'I. Financial Support from Dominick',
        description: 'These questions ask about financial support Dominick provided to the children.',
        questions: [
          { id: 'receivedAnySupport', type: 'yesno', label: 'Did Dominick ever provide any of the children with financial support, purchase items for them, or provide any services?' },
          { id: 'receivedMoney', type: 'yesno', label: 'Did Dominick provide any of the children with money in the 10 years before his death?', showIf: 'receivedAnySupport', rogRef: 'SI-3' },
          { id: 'moneyProvided', type: 'repeatable', label: 'Money provided by Dominick', showIf: 'receivedMoney', rogRef: 'SI-3', fields: [
            { id: 'child', type: 'text', label: 'Which child/children received this money?' },
            { id: 'year', type: 'text', label: 'Year' },
            { id: 'amount', type: 'text', label: 'Amount provided' },
            { id: 'purpose', type: 'text', label: 'What was it for?' },
            { id: 'howProvided', type: 'text', label: 'How was it provided? (cash, check, Venmo, etc.)' }
          ]},
          { id: 'receivedPurchases', type: 'yesno', label: 'Did Dominick purchase anything for any of the children in the 10 years before his death?', showIf: 'receivedAnySupport', rogRef: 'SI-4' },
          { id: 'purchaseDetails', type: 'repeatable', label: 'Items purchased by Dominick', showIf: 'receivedPurchases', rogRef: 'SI-4', fields: [
            { id: 'child', type: 'text', label: 'Which child/children was this purchased for?' },
            { id: 'item', type: 'text', label: 'Item description' },
            { id: 'cost', type: 'text', label: 'Approximate cost' },
            { id: 'date', type: 'text', label: 'Approximate date of purchase' }
          ]},
          { id: 'providedMedicalInsurance', type: 'yesno', label: 'Did Dominick purchase medical insurance for any of the children?', showIf: 'receivedAnySupport' },
          { id: 'medicalInsuranceDetails', type: 'textarea', label: 'Describe the medical insurance coverage Dominick provided', showIf: 'providedMedicalInsurance' },
          { id: 'hadLifeInsurance', type: 'yesno', label: 'Did Dominick have life insurance with any of the children as beneficiaries?' },
          { id: 'lifeInsuranceDetails', type: 'repeatable', label: 'Life insurance policies', showIf: 'hadLifeInsurance', fields: [
            { id: 'company', type: 'text', label: 'Insurance company' },
            { id: 'policyNumber', type: 'text', label: 'Policy number (if known)' },
            { id: 'beneficiaries', type: 'text', label: 'Which children are beneficiaries?' },
            { id: 'amount', type: 'text', label: 'Coverage amount (if known)' }
          ]}
        ]
      },
      {
        id: 'healthcare-treatment',
        title: 'J. Healthcare Treatment Due to Dominick\'s Death',
        description: 'These questions ask about any medical or mental health treatment the children have received as a result of Dominick\'s death.',
        questions: [
          { id: 'childrenReceivedTreatment', type: 'yesno', label: 'Have any of the children received medical or mental health treatment due to Dominick\'s death?', rogRef: 'SI-16' },
          { id: 'treatmentProviders', type: 'repeatable', label: 'Healthcare providers who treated the children', showIf: 'childrenReceivedTreatment', rogRef: 'SI-16', fields: [
            { id: 'child', type: 'text', label: 'Which child received this treatment?' },
            { id: 'providerName', type: 'text', label: 'Provider/facility name' },
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'treatmentType', type: 'text', label: 'Type of treatment (counseling, therapy, medical, etc.)' },
            { id: 'dates', type: 'text', label: 'Dates of treatment' }
          ]},
          { id: 'childrenHaveComplaints', type: 'yesno', label: 'Do any of the children have ongoing complaints (emotional, behavioral, physical) that you attribute to Dominick\'s death?' },
          { id: 'ongoingComplaints', type: 'repeatable', label: 'Ongoing complaints', showIf: 'childrenHaveComplaints', fields: [
            { id: 'child', type: 'text', label: 'Which child has this complaint?' },
            { id: 'description', type: 'textarea', label: 'Description of complaint' },
            { id: 'status', type: 'text', label: 'Is it improving, staying the same, or worsening?' }
          ]}
        ]
      },
      {
        id: 'damages',
        title: 'K. Losses & Damages',
        description: 'Please describe how Dominick\'s death has affected the children.',
        questions: [
          { id: 'lossOfLoveDescription', type: 'textarea', label: 'Describe the loss of love, companionship, comfort, care, assistance, protection, affection, society, and moral support the children have experienced since Dominick\'s death' },
          { id: 'howLifeChanged', type: 'textarea', label: 'How have the children\'s daily lives changed since Dominick\'s death?' },
          { id: 'emotionalImpact', type: 'textarea', label: 'Describe the emotional and psychological impact of Dominick\'s death on the children' },
          { id: 'futureLosses', type: 'textarea', label: 'Describe any future losses the children will experience (e.g., Dominick not being present for graduations, weddings, birthdays, other milestones)' },
          { id: 'economicDamages', type: 'textarea', label: 'Describe any economic damages the children have suffered or will suffer due to Dominick\'s death' },
          { id: 'nonEconomicDamages', type: 'textarea', label: 'Describe any non-economic damages the children have suffered (pain, suffering, emotional distress, etc.)' }
        ]
      },
      {
        id: 'incident-questions',
        title: 'L. Questions About Contributing to the Incident',
        description: 'These are standard legal questions asking whether the children played any role in causing Dominick\'s death. As minor children, they almost certainly did not - so you will likely answer "No" to all of these.',
        questions: [
          { id: 'wasActingAsAgent', type: 'yesno', label: 'At the time of Dominick\'s death, were any of the children acting as an agent or employee for any person in a way that contributed to causing the incident?', rogRef: '2.11' },
          { id: 'hadDisability', type: 'yesno', label: 'Did any of the children have any physical, emotional, or mental disability or condition that contributed to CAUSING Dominick\'s death?', rogRef: '2.12' },
          { id: 'usedSubstances', type: 'yesno', label: 'Within 24 hours before Dominick\'s death, did any of the children use any substance (alcohol, drugs, medication) that contributed to CAUSING the incident?', rogRef: '2.13' }
        ]
      },
      {
        id: 'investigation',
        title: 'M. Investigation & Evidence',
        description: 'These questions ask about witnesses, photographs, and other evidence.',
        questions: [
          { id: 'hasAnyInvestigationInfo', type: 'yesno', label: 'Do you have any knowledge of witnesses, evidence, photographs, or other materials relevant to the children\'s relationship with Dominick?' },
          { id: 'hasPhotosVideos', type: 'yesno', label: 'Do you have any photographs or videos of Dominick with the children?', showIf: 'hasAnyInvestigationInfo' },
          { id: 'photosVideosDescription', type: 'textarea', label: 'Describe the photographs/videos you have (approximate number, when taken, what they show)', showIf: 'hasPhotosVideos' },
          { id: 'hasWrittenCommunications', type: 'yesno', label: 'Do you have any cards, letters, text messages, or other written communications from Dominick to the children?', showIf: 'hasAnyInvestigationInfo' },
          { id: 'writtenCommunicationsDescription', type: 'textarea', label: 'Describe the written communications you have', showIf: 'hasWrittenCommunications' },
          { id: 'hasCharacterWitnesses', type: 'yesno', label: 'Are there other people who could speak about Dominick\'s character, personality, or his relationship with the children?', showIf: 'hasAnyInvestigationInfo' },
          { id: 'characterWitnesses', type: 'repeatable', label: 'Character/relationship witnesses', showIf: 'hasCharacterWitnesses', fields: [
            { id: 'name', type: 'text', label: 'Name' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'relationship', type: 'text', label: 'Relationship to Dominick/children' },
            { id: 'whatTheyKnow', type: 'textarea', label: 'What can they speak to?' }
          ]}
        ]
      },
      {
        id: 'documents-checklist',
        title: 'N. Documents Checklist',
        description: 'Please check all documents you have access to and can provide for the children. This helps us know what evidence we can use to support the case.',
        questions: [
          { id: 'docs_identity', type: 'checklist', label: 'Identity & Relationship Documents', options: [
            { id: 'birthCertificates', label: 'Children\'s birth certificates (showing Dominick as father)' },
            { id: 'socialSecurityCards', label: 'Children\'s Social Security cards' }
          ]},
          { id: 'docs_residency', type: 'checklist', label: 'Residency Documents', options: [
            { id: 'residencyDocs', label: 'Documents showing children\'s residence addresses (2013-2023)' },
            { id: 'residencyWithDominick', label: 'Documents showing residences where children lived with Dominick' }
          ]},
          { id: 'docs_school', type: 'checklist', label: 'School Records', options: [
            { id: 'schoolRecords', label: 'School enrollment records' },
            { id: 'attendanceRecords', label: 'School attendance records' }
          ]},
          { id: 'docs_financial', type: 'checklist', label: 'Financial Documents', options: [
            { id: 'financialSupport', label: 'Documents showing financial support from Dominick (2013-2023)' },
            { id: 'purchaseReceipts', label: 'Receipts for items Dominick purchased for children' },
            { id: 'medicalInsurance', label: 'Documents showing medical insurance from Dominick' },
            { id: 'lifeInsurance', label: 'Life insurance policies naming children as beneficiaries' }
          ]},
          { id: 'docs_medical', type: 'checklist', label: 'Medical Documents', options: [
            { id: 'medicalTreatment', label: 'Medical treatment records related to Dominick\'s death' },
            { id: 'mentalHealthTreatment', label: 'Mental health/counseling records related to Dominick\'s death' }
          ]},
          { id: 'docs_relationship', type: 'checklist', label: 'Relationship Evidence', options: [
            { id: 'photos', label: 'Photographs of children with Dominick' },
            { id: 'cardsLetters', label: 'Cards, letters, or notes from Dominick to the children' },
            { id: 'textMessages', label: 'Text messages or social media communications' },
            { id: 'videos', label: 'Videos of children with Dominick' },
            { id: 'socialEventDocs', label: 'Documents/photos from social events with Dominick (2013-2023)' },
            { id: 'vacationDocs', label: 'Documents/photos from vacations with Dominick (2013-2023)' }
          ]},
          { id: 'docs_court', type: 'checklist', label: 'Court & Legal Documents', options: [
            { id: 'juvenileDependency', label: 'Juvenile Dependency proceeding documents' },
            { id: 'custodyOrders', label: 'Custody orders or agreements' },
            { id: 'otherCourtDocs', label: 'Other court documents relating to the children' }
          ]},
          { id: 'docs_claims', type: 'checklist', label: 'Documents Supporting Legal Claims', options: [
            { id: 'batteryDocs', label: 'Documents supporting battery claim' },
            { id: 'negligenceDocs', label: 'Documents supporting negligence claim' },
            { id: 'falseImprisonmentDocs', label: 'Documents supporting false imprisonment claim' },
            { id: 'civilCodeDocs', label: 'Documents supporting Civil Code section 52.1 claim' },
            { id: 'punitiveDamagesDocs', label: 'Documents supporting punitive damages claim' },
            { id: 'trialDocs', label: 'Documents you intend to rely on at trial' }
          ]}
        ]
      },
      {
        id: 'final-questions',
        title: 'O. Final Questions',
        questions: [
          { id: 'responsePrepHelpers', type: 'repeatable', label: 'Who helped you prepare these responses? (List each person who prepared or assisted)', rogRef: '1.1', fields: [
            { id: 'name', type: 'text', label: 'Name' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'relationship', type: 'text', label: 'Relationship to you/children' }
          ]},
          { id: 'anythingElse', type: 'textarea', label: 'Is there anything else you think is relevant to the children\'s case that we haven\'t asked about?' },
          { id: 'unableToLocate', type: 'textarea', label: 'Are there any documents you are unable to locate? If so, which ones and why?' },
          { id: 'additionalNotes', type: 'textarea', label: 'Any additional notes or messages for your attorney' }
        ]
      }
    ]
  },
  'alvarado-vasquez': {
    clientName: 'Ashley Vasquez (Guardian Ad Litem)',
    caseName: 'Alvarado v. State of California, et al.',
    caseNumber: '25STCV35294',
    decedent: 'Dominick Alvarado',
    decedentDOD: 'July 21, 2023',
    deadline: 'January 26, 2026',
    passwordPrefix: 'Vasquez',
    dropboxLink: 'https://www.dropbox.com/request/9hnjYKu87tKg0a8T8FD8',
    sections: [
      {
        id: 'gal-info',
        title: 'A. Guardian Ad Litem Information',
        description: 'As the Guardian Ad Litem, please provide your own contact information first.',
        questions: [
          { id: 'galNameDisplay', type: 'static', label: 'Your name as it appears in court records:', value: 'Ashley Vasquez' },
          { id: 'galNameNeedsCorrection', type: 'yesno', label: 'Does the spelling of your name need to be corrected?' },
          { id: 'galCorrectedName', type: 'text', label: 'Please provide the correct spelling of your name', showIf: 'galNameNeedsCorrection' },
          { id: 'galAddress', type: 'textarea', label: 'Your current address (street, city, state, zip)' },
          { id: 'galPhone', type: 'text', label: 'Your phone number' },
          { id: 'galEmail', type: 'text', label: 'Your email address' },
          { id: 'galRelationship', type: 'text', label: 'Your relationship to Caleb', placeholder: 'e.g., grandmother, aunt, family friend' }
        ]
      },
      {
        id: 'child-caleb',
        title: 'B. Caleb Aiden Alvarado - Basic Information',
        description: 'Please provide the following information for Caleb Aiden Alvarado.',
        questions: [
          { id: 'caleb_nameDisplay', type: 'static', label: 'Name as it appears in court records:', value: 'Caleb Aiden Alvarado' },
          { id: 'caleb_nameNeedsCorrection', type: 'yesno', label: 'Does the spelling of Caleb\'s name need to be corrected?' },
          { id: 'caleb_correctedName', type: 'text', label: 'Please provide the correct spelling of Caleb\'s name', showIf: 'caleb_nameNeedsCorrection' },
          { id: 'caleb_dateOfBirth', type: 'date', label: 'Date of birth', rogRef: '2.2' },
          { id: 'caleb_placeOfBirth', type: 'text', label: 'Place of birth (city, state, country)', rogRef: '2.2' },
          { id: 'caleb_currentAddress', type: 'textarea', label: 'Current address (street, city, state, zip)', rogRef: '2.5(a)' },
          { id: 'caleb_biologicalMother', type: 'text', label: 'Full name of Caleb\'s biological mother', rogRef: 'SI-1' },
          { id: 'caleb_biologicalMotherAddress', type: 'textarea', label: 'Biological mother\'s address', rogRef: 'SI-1' },
          { id: 'caleb_biologicalMotherPhone', type: 'text', label: 'Biological mother\'s phone number', rogRef: 'SI-1' },
          { id: 'caleb_biologicalMotherEmail', type: 'text', label: 'Biological mother\'s email address', rogRef: 'SI-1' },
          { id: 'caleb_isDominickBiologicalFather', type: 'yesno', label: 'Is Dominick Alvarado Caleb\'s biological father?', rogRef: 'SI-7' },
          { id: 'caleb_biologicalFatherFacts', type: 'textarea', label: 'State all facts that support Caleb being Dominick\'s natural child', rogRef: 'SI-11' },
          { id: 'caleb_hasBeenAdopted', type: 'yesno', label: 'Has Caleb ever been adopted?', rogRef: 'SI-10' },
          { id: 'caleb_adoptionDetails', type: 'repeatable', label: 'Adoption details', showIf: 'caleb_hasBeenAdopted', rogRef: 'SI-10', fields: [
            { id: 'name', type: 'text', label: 'Name of adopting person' },
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'adoptionDate', type: 'date', label: 'Date of adoption' }
          ]},
          { id: 'caleb_parentalRightsTerminated', type: 'yesno', label: 'Were Dominick\'s parental rights over Caleb ever terminated or limited?', rogRef: 'SI-8' },
          { id: 'caleb_parentalRightsDates', type: 'textarea', label: 'If yes, state the dates when those rights were terminated or limited', showIf: 'caleb_parentalRightsTerminated', rogRef: 'SI-8' },
          { id: 'caleb_custodialRightsTerminated', type: 'yesno', label: 'Were Dominick\'s custodial rights over Caleb ever terminated or limited?', rogRef: 'SI-9' },
          { id: 'caleb_custodialRightsDates', type: 'textarea', label: 'If yes, state the dates when those rights were terminated or limited', showIf: 'caleb_custodialRightsTerminated', rogRef: 'SI-9' },
          { id: 'caleb_hasCourtProceedings', type: 'yesno', label: 'Have there been any court proceedings relating to Caleb (custody, dependency, etc.)?', rogRef: 'SI-17' },
          { id: 'caleb_courtProceedings', type: 'repeatable', label: 'Court proceedings', showIf: 'caleb_hasCourtProceedings', rogRef: 'SI-17', fields: [
            { id: 'venue', type: 'text', label: 'Court venue (county and state)' },
            { id: 'caseNumber', type: 'text', label: 'Case number' },
            { id: 'description', type: 'text', label: 'Description of proceeding' }
          ]},
          { id: 'caleb_hasAttendedSchool', type: 'yesno', label: 'Has Caleb attended any schools?', rogRef: 'SI-2' },
          { id: 'caleb_schools', type: 'repeatable', label: 'Schools attended', showIf: 'caleb_hasAttendedSchool', rogRef: 'SI-2', fields: [
            { id: 'name', type: 'text', label: 'School name' },
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'datesAttended', type: 'text', label: 'Dates attended' }
          ]}
        ]
      },
      {
        id: 'living-with-dominick',
        title: 'C. Living with Dominick',
        description: 'These questions ask about periods when Caleb lived with Dominick.',
        questions: [
          { id: 'calebLivedWithDominick', type: 'yesno', label: 'Did Caleb ever live with Dominick?', rogRef: 'SI-5' },
          { id: 'livingPeriods', type: 'repeatable', label: 'Periods living with Dominick', showIf: 'calebLivedWithDominick', rogRef: 'SI-5,SI-6', fields: [
            { id: 'address', type: 'textarea', label: 'Address where they lived together' },
            { id: 'dateFrom', type: 'text', label: 'From date' },
            { id: 'dateTo', type: 'text', label: 'To date' }
          ]},
          { id: 'othersLivedWith', type: 'repeatable', label: 'Other people who lived with Dominick and Caleb', showIf: 'calebLivedWithDominick', rogRef: 'SI-6', fields: [
            { id: 'name', type: 'text', label: 'Name' },
            { id: 'address', type: 'textarea', label: 'Current address (if known)' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'relationship', type: 'text', label: 'Relationship to Dominick/Caleb' },
            { id: 'dates', type: 'text', label: 'Dates they lived together' }
          ]}
        ]
      },
      {
        id: 'relationship',
        title: 'D. Caleb\'s Relationship with Dominick',
        description: 'These questions ask about Caleb\'s relationship with his father Dominick.',
        questions: [
          { id: 'activitiesTogether', type: 'textarea', label: 'Describe the activities that Caleb and Dominick enjoyed doing together as father and son', rogRef: 'SI-12' },
          { id: 'communicationFrequency', type: 'text', label: 'How frequently did Caleb see Dominick in the 5 years before his death?', rogRef: 'SI-13', placeholder: 'e.g., daily, weekly, monthly, rarely' },
          { id: 'approximateVisits', type: 'text', label: 'Approximately how many times did Caleb see Dominick in the 5 years before his death?', rogRef: 'SI-13' },
          { id: 'phoneCallFrequency', type: 'text', label: 'How many times did Caleb speak to Dominick on the phone in the 5 years before his death?', rogRef: 'SI-14' },
          { id: 'writtenCommunication', type: 'text', label: 'How many times did Caleb and Dominick communicate in writing (text, email, cards, letters) in the 5 years before his death?', rogRef: 'SI-15' },
          { id: 'communicationMethods', type: 'multiselect', label: 'How did Caleb communicate with Dominick? (Select all that apply)', options: ['Phone calls', 'Text messages', 'In person', 'Video calls', 'Social media', 'Cards/Letters'] },
          { id: 'relationshipDescription', type: 'textarea', label: 'Describe the bond and relationship Caleb had with Dominick. What made their relationship special?' },
          { id: 'majorLifeEvents', type: 'yesno', label: 'Did Dominick participate in major life events with Caleb (birthdays, holidays, school events, etc.)?' },
          { id: 'majorLifeEventsList', type: 'repeatable', label: 'Major life events with Dominick', showIf: 'majorLifeEvents', fields: [
            { id: 'event', type: 'text', label: 'Event type (birthday, holiday, school event, etc.)' },
            { id: 'date', type: 'text', label: 'Approximate date' },
            { id: 'description', type: 'text', label: 'Description of Dominick\'s participation' }
          ]},
          { id: 'hadVacations', type: 'yesno', label: 'Did Caleb take any vacations or trips with Dominick?' },
          { id: 'vacationDetails', type: 'repeatable', label: 'Vacations/trips with Dominick', showIf: 'hadVacations', fields: [
            { id: 'location', type: 'text', label: 'Location' },
            { id: 'dates', type: 'text', label: 'Dates' }
          ]}
        ]
      },
      {
        id: 'financial-support',
        title: 'E. Financial Support from Dominick',
        description: 'These questions ask about financial support Dominick provided to Caleb.',
        questions: [
          { id: 'receivedAnySupport', type: 'yesno', label: 'Did Dominick ever provide Caleb with financial support, purchase items for him, or provide any services?' },
          { id: 'receivedMoney', type: 'yesno', label: 'Did Dominick provide Caleb with money in the 10 years before his death?', showIf: 'receivedAnySupport', rogRef: 'SI-3' },
          { id: 'moneyProvided', type: 'repeatable', label: 'Money provided by Dominick', showIf: 'receivedMoney', rogRef: 'SI-3', fields: [
            { id: 'year', type: 'text', label: 'Year' },
            { id: 'amount', type: 'text', label: 'Amount provided' },
            { id: 'purpose', type: 'text', label: 'What was it for?' },
            { id: 'howProvided', type: 'text', label: 'How was it provided? (cash, check, Venmo, etc.)' }
          ]},
          { id: 'receivedPurchases', type: 'yesno', label: 'Did Dominick purchase anything for Caleb in the 10 years before his death?', showIf: 'receivedAnySupport', rogRef: 'SI-4' },
          { id: 'purchaseDetails', type: 'repeatable', label: 'Items purchased by Dominick', showIf: 'receivedPurchases', rogRef: 'SI-4', fields: [
            { id: 'item', type: 'text', label: 'Item description' },
            { id: 'cost', type: 'text', label: 'Approximate cost' },
            { id: 'date', type: 'text', label: 'Approximate date of purchase' }
          ]},
          { id: 'providedMedicalInsurance', type: 'yesno', label: 'Did Dominick purchase medical insurance for Caleb?', showIf: 'receivedAnySupport' },
          { id: 'medicalInsuranceDetails', type: 'textarea', label: 'Describe the medical insurance coverage Dominick provided', showIf: 'providedMedicalInsurance' },
          { id: 'hadLifeInsurance', type: 'yesno', label: 'Did Dominick have life insurance with Caleb as a beneficiary?' },
          { id: 'lifeInsuranceDetails', type: 'repeatable', label: 'Life insurance policies', showIf: 'hadLifeInsurance', fields: [
            { id: 'company', type: 'text', label: 'Insurance company' },
            { id: 'policyNumber', type: 'text', label: 'Policy number (if known)' },
            { id: 'amount', type: 'text', label: 'Coverage amount (if known)' }
          ]}
        ]
      },
      {
        id: 'healthcare-treatment',
        title: 'F. Healthcare Treatment Due to Dominick\'s Death',
        description: 'These questions ask about any medical or mental health treatment Caleb has received as a result of Dominick\'s death.',
        questions: [
          { id: 'calebReceivedTreatment', type: 'yesno', label: 'Has Caleb received medical or mental health treatment due to Dominick\'s death?', rogRef: 'SI-16' },
          { id: 'treatmentProviders', type: 'repeatable', label: 'Healthcare providers who treated Caleb', showIf: 'calebReceivedTreatment', rogRef: 'SI-16', fields: [
            { id: 'providerName', type: 'text', label: 'Provider/facility name' },
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'treatmentType', type: 'text', label: 'Type of treatment (counseling, therapy, medical, etc.)' },
            { id: 'dates', type: 'text', label: 'Dates of treatment' }
          ]},
          { id: 'calebHasComplaints', type: 'yesno', label: 'Does Caleb have ongoing complaints (emotional, behavioral, physical) that you attribute to Dominick\'s death?' },
          { id: 'ongoingComplaints', type: 'repeatable', label: 'Ongoing complaints', showIf: 'calebHasComplaints', fields: [
            { id: 'description', type: 'textarea', label: 'Description of complaint' },
            { id: 'status', type: 'text', label: 'Is it improving, staying the same, or worsening?' }
          ]}
        ]
      },
      {
        id: 'damages',
        title: 'G. Losses & Damages',
        description: 'Please describe how Dominick\'s death has affected Caleb.',
        questions: [
          { id: 'lossOfLoveDescription', type: 'textarea', label: 'Describe the loss of love, companionship, comfort, care, assistance, protection, affection, society, and moral support Caleb has experienced since Dominick\'s death' },
          { id: 'howLifeChanged', type: 'textarea', label: 'How has Caleb\'s daily life changed since Dominick\'s death?' },
          { id: 'emotionalImpact', type: 'textarea', label: 'Describe the emotional and psychological impact of Dominick\'s death on Caleb' },
          { id: 'futureLosses', type: 'textarea', label: 'Describe any future losses Caleb will experience (e.g., Dominick not being present for graduations, birthdays, other milestones)' },
          { id: 'economicDamages', type: 'textarea', label: 'Describe any economic damages Caleb has suffered or will suffer due to Dominick\'s death' },
          { id: 'nonEconomicDamages', type: 'textarea', label: 'Describe any non-economic damages Caleb has suffered (pain, suffering, emotional distress, etc.)' }
        ]
      },
      {
        id: 'incident-questions',
        title: 'H. Questions About Contributing to the Incident',
        description: 'These are standard legal questions asking whether Caleb played any role in causing Dominick\'s death. As a minor child, he almost certainly did not - so you will likely answer "No" to all of these.',
        questions: [
          { id: 'wasActingAsAgent', type: 'yesno', label: 'At the time of Dominick\'s death, was Caleb acting as an agent or employee for any person in a way that contributed to causing the incident?', rogRef: '2.11' },
          { id: 'hadDisability', type: 'yesno', label: 'Did Caleb have any physical, emotional, or mental disability or condition that contributed to CAUSING Dominick\'s death?', rogRef: '2.12' },
          { id: 'usedSubstances', type: 'yesno', label: 'Within 24 hours before Dominick\'s death, did Caleb use any substance (alcohol, drugs, medication) that contributed to CAUSING the incident?', rogRef: '2.13' }
        ]
      },
      {
        id: 'investigation',
        title: 'I. Investigation & Evidence',
        description: 'These questions ask about witnesses, photographs, and other evidence.',
        questions: [
          { id: 'hasAnyInvestigationInfo', type: 'yesno', label: 'Do you have any knowledge of witnesses, evidence, photographs, or other materials relevant to Caleb\'s relationship with Dominick?' },
          { id: 'hasPhotosVideos', type: 'yesno', label: 'Do you have any photographs or videos of Dominick with Caleb?', showIf: 'hasAnyInvestigationInfo' },
          { id: 'photosVideosDescription', type: 'textarea', label: 'Describe the photographs/videos you have (approximate number, when taken, what they show)', showIf: 'hasPhotosVideos' },
          { id: 'hasWrittenCommunications', type: 'yesno', label: 'Do you have any cards, letters, text messages, or other written communications from Dominick to Caleb?', showIf: 'hasAnyInvestigationInfo' },
          { id: 'writtenCommunicationsDescription', type: 'textarea', label: 'Describe the written communications you have', showIf: 'hasWrittenCommunications' },
          { id: 'hasCharacterWitnesses', type: 'yesno', label: 'Are there other people who could speak about Dominick\'s character, personality, or his relationship with Caleb?', showIf: 'hasAnyInvestigationInfo' },
          { id: 'characterWitnesses', type: 'repeatable', label: 'Character/relationship witnesses', showIf: 'hasCharacterWitnesses', fields: [
            { id: 'name', type: 'text', label: 'Name' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'relationship', type: 'text', label: 'Relationship to Dominick/Caleb' },
            { id: 'whatTheyKnow', type: 'textarea', label: 'What can they speak to?' }
          ]}
        ]
      },
      {
        id: 'documents-checklist',
        title: 'J. Documents Checklist',
        description: 'Please check all documents you have access to and can provide for Caleb. This helps us know what evidence we can use to support the case.',
        questions: [
          { id: 'docs_identity', type: 'checklist', label: 'Identity & Relationship Documents', options: [
            { id: 'birthCertificate', label: 'Caleb\'s birth certificate (showing Dominick as father)' },
            { id: 'socialSecurityCard', label: 'Caleb\'s Social Security card' }
          ]},
          { id: 'docs_residency', type: 'checklist', label: 'Residency Documents', options: [
            { id: 'residencyDocs', label: 'Documents showing Caleb\'s residence addresses (2013-2023)' },
            { id: 'residencyWithDominick', label: 'Documents showing residences where Caleb lived with Dominick' }
          ]},
          { id: 'docs_school', type: 'checklist', label: 'School Records', options: [
            { id: 'schoolRecords', label: 'School enrollment records' },
            { id: 'attendanceRecords', label: 'School attendance records' }
          ]},
          { id: 'docs_financial', type: 'checklist', label: 'Financial Documents', options: [
            { id: 'financialSupport', label: 'Documents showing financial support from Dominick (2013-2023)' },
            { id: 'purchaseReceipts', label: 'Receipts for items Dominick purchased for Caleb' },
            { id: 'medicalInsurance', label: 'Documents showing medical insurance from Dominick' },
            { id: 'lifeInsurance', label: 'Life insurance policies naming Caleb as beneficiary' }
          ]},
          { id: 'docs_medical', type: 'checklist', label: 'Medical Documents', options: [
            { id: 'medicalTreatment', label: 'Medical treatment records related to Dominick\'s death' },
            { id: 'mentalHealthTreatment', label: 'Mental health/counseling records related to Dominick\'s death' }
          ]},
          { id: 'docs_relationship', type: 'checklist', label: 'Relationship Evidence', options: [
            { id: 'photos', label: 'Photographs of Caleb with Dominick' },
            { id: 'cardsLetters', label: 'Cards, letters, or notes from Dominick to Caleb' },
            { id: 'textMessages', label: 'Text messages or social media communications' },
            { id: 'videos', label: 'Videos of Caleb with Dominick' },
            { id: 'socialEventDocs', label: 'Documents/photos from social events with Dominick (2013-2023)' },
            { id: 'vacationDocs', label: 'Documents/photos from vacations with Dominick (2013-2023)' }
          ]},
          { id: 'docs_court', type: 'checklist', label: 'Court & Legal Documents', options: [
            { id: 'juvenileDependency', label: 'Juvenile Dependency proceeding documents' },
            { id: 'custodyOrders', label: 'Custody orders or agreements' },
            { id: 'otherCourtDocs', label: 'Other court documents relating to Caleb' }
          ]},
          { id: 'docs_claims', type: 'checklist', label: 'Documents Supporting Legal Claims', options: [
            { id: 'batteryDocs', label: 'Documents supporting battery claim' },
            { id: 'negligenceDocs', label: 'Documents supporting negligence claim' },
            { id: 'falseImprisonmentDocs', label: 'Documents supporting false imprisonment claim' },
            { id: 'civilCodeDocs', label: 'Documents supporting Civil Code section 52.1 claim' },
            { id: 'punitiveDamagesDocs', label: 'Documents supporting punitive damages claim' },
            { id: 'trialDocs', label: 'Documents you intend to rely on at trial' }
          ]}
        ]
      },
      {
        id: 'final-questions',
        title: 'K. Final Questions',
        questions: [
          { id: 'responsePrepHelpers', type: 'repeatable', label: 'Who helped you prepare these responses? (List each person who prepared or assisted)', rogRef: '1.1', fields: [
            { id: 'name', type: 'text', label: 'Name' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'relationship', type: 'text', label: 'Relationship to you/Caleb' }
          ]},
          { id: 'anythingElse', type: 'textarea', label: 'Is there anything else you think is relevant to Caleb\'s case that we haven\'t asked about?' },
          { id: 'unableToLocate', type: 'textarea', label: 'Are there any documents you are unable to locate? If so, which ones and why?' },
          { id: 'additionalNotes', type: 'textarea', label: 'Any additional notes or messages for your attorney' }
        ]
      }
    ]
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getDaysUntilDeadline(deadline) {
  const deadlineDate = new Date(deadline)
  const today = new Date()
  const diffTime = deadlineDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function calculateProgress(sections, responses) {
  if (!sections || !responses) return 0

  let totalQuestions = 0
  let answeredQuestions = 0

  const isAnswered = (question, value) => {
    if (question.type === 'static') return true // Static fields don't need answers
    if (value === undefined || value === null || value === '') return false
    if (question.type === 'yesno') return value === true || value === false
    if (question.type === 'multiselect') return Array.isArray(value) && value.length > 0
    if (question.type === 'checklist') return typeof value === 'object' && Object.values(value).some(v => v === true)
    if (question.type === 'repeatable') return Array.isArray(value) && value.length > 0
    return true
  }

  for (const section of sections) {
    for (const question of section.questions) {
      // Check if this question should be shown (handle showIf conditions)
      if (question.showIf) {
        const parentValue = responses[question.showIf]
        const expectedValue = question.showIfValue !== undefined ? question.showIfValue : true
        if (parentValue !== expectedValue) {
          // This question is hidden, don't count it
          continue
        }
      }

      totalQuestions++
      if (isAnswered(question, responses[question.id])) {
        answeredQuestions++
      }
    }
  }

  if (totalQuestions === 0) return 0
  return Math.round((answeredQuestions / totalQuestions) * 100)
}

// ============================================================================
// FORM COMPONENTS
// ============================================================================

function YesNoToggle({ value, onChange, disabled }) {
  const handleClick = (newValue) => {
    if (disabled) return
    // If clicking the already-selected value, deselect it
    if (value === newValue) {
      onChange(undefined)
    } else {
      onChange(newValue)
    }
  }

  return (
    <div className="flex gap-6">
      <button
        type="button"
        onClick={() => handleClick(true)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-1 rounded-md border transition-colors ${
          value === true
            ? 'bg-blue-100 border-blue-500 text-blue-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span>Yes</span>
      </button>
      <button
        type="button"
        onClick={() => handleClick(false)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-1 rounded-md border transition-colors ${
          value === false
            ? 'bg-blue-100 border-blue-500 text-blue-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span>No</span>
      </button>
    </div>
  )
}

function MultiSelect({ options, value = [], onChange, disabled }) {
  const toggleOption = (option) => {
    if (disabled) return
    const newValue = value.includes(option)
      ? value.filter(v => v !== option)
      : [...value, option]
    onChange(newValue)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <button
          key={option}
          type="button"
          onClick={() => toggleOption(option)}
          disabled={disabled}
          className={`chip ${value.includes(option) ? 'chip-active' : ''} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function Checklist({ options, value = {}, onChange, disabled }) {
  const toggleOption = (optionId) => {
    if (disabled) return
    onChange({
      ...value,
      [optionId]: !value[optionId]
    })
  }

  return (
    <div className="space-y-2">
      {options.map(option => (
        <label key={option.id} className={`flex items-start gap-3 p-2 rounded hover:bg-gray-50 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={value[option.id] || false}
            onChange={() => toggleOption(option.id)}
            disabled={disabled}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  )
}

function RepeatableField({ fields, value = [], onChange, disabled }) {
  const addEntry = () => {
    if (disabled) return
    const newEntry = {}
    fields.forEach(f => { newEntry[f.id] = '' })
    onChange([...value, newEntry])
  }

  const removeEntry = (index) => {
    if (disabled) return
    onChange(value.filter((_, i) => i !== index))
  }

  const updateEntry = (index, fieldId, fieldValue) => {
    if (disabled) return
    const newValue = [...value]
    newValue[index] = { ...newValue[index], [fieldId]: fieldValue }
    onChange(newValue)
  }

  return (
    <div className="space-y-4">
      {value.map((entry, index) => (
        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-500">Entry {index + 1}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            {fields.map(field => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={entry[field.id] || ''}
                    onChange={(e) => updateEntry(index, field.id, e.target.value)}
                    disabled={disabled}
                    className="input-field"
                    rows={2}
                  />
                ) : (
                  <input
                    type="text"
                    value={entry[field.id] || ''}
                    onChange={(e) => updateEntry(index, field.id, e.target.value)}
                    disabled={disabled}
                    className="input-field"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={addEntry}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus size={18} /> Add Entry
        </button>
      )}
    </div>
  )
}

function FieldComment({ questionId, comments = [], onAddComment, onResolveComment, role }) {
  const [isOpen, setIsOpen] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const hasComments = comments.length > 0

  const handleAdd = async () => {
    if (!newComment.trim() || isSaving) return
    setIsSaving(true)
    try {
      await onAddComment(questionId, newComment.trim())
      setNewComment('')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResolve = async (commentIndex) => {
    if (isSaving) return
    setIsSaving(true)
    try {
      await onResolveComment(questionId, commentIndex)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-full transition-colors ${
          hasComments
            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }`}
        title={hasComments ? `${comments.length} comment(s)` : 'Add a comment or question'}
      >
        <MessageCircle size={18} />
        {hasComments && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white text-[10px] text-white flex items-center justify-center font-medium">
            {comments.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Comments & Questions</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto p-3 space-y-2">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No comments yet. Add a question or note for clarification.
              </p>
            ) : (
              comments.map((comment, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-xs text-yellow-800">
                          {comment.role === 'client' ? 'Client' : 'Attorney'}
                        </span>
                        <span className="text-xs text-yellow-600">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-gray-800">{comment.text}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResolve(idx)}
                      disabled={isSaving}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                      title="Mark as resolved (delete)"
                    >
                      <CheckCircle size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-gray-100">
            <div className="flex gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment or question..."
                className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                rows={2}
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newComment.trim() || isSaving}
                className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Question({ question, value, onChange, responses, disabled, comments, onAddComment, onResolveComment, role }) {
  // Check showIf condition
  if (question.showIf) {
    const parentValue = responses[question.showIf]
    const expectedValue = question.showIfValue !== undefined ? question.showIfValue : true
    if (parentValue !== expectedValue) {
      return null
    }
  }

  const renderInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            disabled={disabled}
            className="input-field"
          />
        )
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            disabled={disabled}
            className="input-field"
            rows={3}
          />
        )
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="input-field"
          />
        )
      case 'yesno':
        return <YesNoToggle value={value} onChange={onChange} disabled={disabled} />
      case 'multiselect':
        return <MultiSelect options={question.options} value={value} onChange={onChange} disabled={disabled} />
      case 'checklist':
        return <Checklist options={question.options} value={value} onChange={onChange} disabled={disabled} />
      case 'repeatable':
        return <RepeatableField fields={question.fields} value={value} onChange={onChange} disabled={disabled} />
      case 'static':
        return (
          <div className="py-2 px-3 bg-gray-100 rounded-md text-gray-800 font-medium">
            {question.value}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div id={`question-${question.id}`} className="py-4 border-b border-gray-100 last:border-b-0 scroll-mt-32">
      <div className="flex items-start justify-between gap-2 mb-2">
        <label className="block text-gray-800 font-medium">{question.label}</label>
        {onAddComment && (
          <FieldComment
            questionId={question.id}
            comments={comments}
            onAddComment={onAddComment}
            onResolveComment={onResolveComment}
            role={role}
          />
        )}
      </div>
      {renderInput()}
    </div>
  )
}

function Section({ section, responses, onChange, disabled, defaultExpanded = false, dropboxLink, comments = {}, onAddComment, onResolveComment, role }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <h2 className="text-lg font-semibold text-gray-800">{section.title}</h2>
        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>
      {isExpanded && (
        <div className="px-6 py-4">
          {section.description && (
            <p className="text-gray-600 text-sm mb-4 pb-4 border-b border-gray-100">{section.description}</p>
          )}
          {section.id === 'documents-checklist' && dropboxLink && (
            <a
              href={dropboxLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                <Upload className="text-white" size={24} />
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-800">Upload Your Documents</h3>
                <p className="text-sm text-gray-600">Click here to securely upload your documents via Dropbox</p>
              </div>
              <ExternalLink className="text-blue-500 group-hover:text-blue-700 flex-shrink-0" size={20} />
            </a>
          )}
          {section.questions.map(question => (
            <Question
              key={question.id}
              question={question}
              value={responses[question.id]}
              onChange={(newValue) => onChange(question.id, newValue)}
              responses={responses}
              disabled={disabled}
              comments={comments[question.id] || []}
              onAddComment={onAddComment}
              onResolveComment={onResolveComment}
              role={role}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// LOGIN FORM
// ============================================================================

function LoginForm({ title, clientSlug = null, onSuccess }) {
  const [password, setPassword] = useState('')
  const { login, isLoading, error } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(password, clientSlug)
    if (result.success && onSuccess) {
      onSuccess(result.role)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Lock className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-600 mt-2">Please enter your password to continue</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="input-field mb-4"
            autoFocus
            disabled={isLoading}
          />
          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Verifying...
              </span>
            ) : (
              'Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// Logout button component
function LogoutButton() {
  const { logout } = useAuth()

  return (
    <button
      onClick={logout}
      className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
      title="Log out"
    >
      <LogOut size={16} />
      <span className="hidden sm:inline">Log out</span>
    </button>
  )
}

// ============================================================================
// CLIENT FORM PAGE
// ============================================================================

function ClientFormContent() {
  const { clientSlug } = useParams()
  const client = CLIENTS[clientSlug]
  const { authFetch } = useAuth()
  const [responses, setResponses] = useState({})
  const [comments, setComments] = useState({})
  const [saveStatus, setSaveStatus] = useState('idle') // idle, saving, saved, error
  const [lastSaved, setLastSaved] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Debounce refs for auto-save
  const saveTimeoutRef = useRef(null)
  const pendingResponsesRef = useRef(null)

  // Load existing responses and comments
  useEffect(() => {
    if (!client) return

    const loadData = async () => {
      try {
        const [responsesRes, commentsRes] = await Promise.all([
          authFetch(`/api/get-responses?clientSlug=${clientSlug}`),
          authFetch(`/api/get-messages?clientSlug=${clientSlug}`)
        ])

        if (responsesRes.ok) {
          const data = await responsesRes.json()
          if (data.responses) {
            setResponses(data.responses)
            setLastSaved(data.updatedAt)
          }
        }

        if (commentsRes.ok) {
          const data = await commentsRes.json()
          if (data.messages) {
            setComments(data.messages)
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [clientSlug, client, authFetch])

  // Auto-save function
  const saveResponses = useCallback(async (newResponses) => {
    setSaveStatus('saving')
    try {
      const res = await authFetch('/api/save-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSlug,
          responses: newResponses
        })
      })
      if (res.ok) {
        const data = await res.json()
        setLastSaved(data.updatedAt)
        setSaveStatus('saved')
      } else {
        setSaveStatus('error')
      }
    } catch (err) {
      console.error('Failed to save:', err)
      setSaveStatus('error')
    }
  }, [clientSlug, authFetch])

  // Handle field change with debounced auto-save
  const handleChange = useCallback((questionId, value) => {
    const newResponses = { ...responses, [questionId]: value }
    setResponses(newResponses)

    // Store pending responses for potential unmount save
    pendingResponsesRef.current = newResponses

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Show saving indicator immediately for better UX
    setSaveStatus('saving')

    // Debounce the actual save by 800ms
    saveTimeoutRef.current = setTimeout(() => {
      saveResponses(newResponses)
      pendingResponsesRef.current = null
    }, 800)
  }, [responses, saveResponses])

  // Save pending changes on unmount to prevent data loss
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      // If there are pending unsaved changes, save them immediately
      if (pendingResponsesRef.current) {
        // Use sendBeacon for reliable unmount saves, fall back to sync save
        const data = JSON.stringify({
          clientSlug,
          responses: pendingResponsesRef.current
        })
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/save-responses', new Blob([data], { type: 'application/json' }))
        }
      }
    }
  }, [clientSlug])

  // Add a comment on a field
  const handleAddComment = useCallback(async (questionId, text) => {
    try {
      const res = await authFetch('/api/save-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSlug,
          questionId,
          role: 'client',
          text
        })
      })
      if (res.ok) {
        const data = await res.json()
        setComments(prev => ({
          ...prev,
          [questionId]: [...(prev[questionId] || []), data.message]
        }))
      }
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }, [clientSlug, authFetch])

  // Resolve (delete) a comment
  const handleResolveComment = useCallback(async (questionId, commentIndex) => {
    try {
      const res = await authFetch('/api/resolve-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSlug,
          questionId,
          commentIndex
        })
      })
      if (res.ok) {
        setComments(prev => ({
          ...prev,
          [questionId]: prev[questionId].filter((_, i) => i !== commentIndex)
        }))
      }
    } catch (err) {
      console.error('Failed to resolve comment:', err)
    }
  }, [clientSlug, authFetch])

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Client Not Found</h1>
          <p className="text-gray-600">The requested client form does not exist.</p>
        </div>
      </div>
    )
  }

  const daysUntilDeadline = getDaysUntilDeadline(client.deadline)

  // Calculate progress in real-time
  const progress = useMemo(() => {
    return calculateProgress(client.sections, responses)
  }, [client.sections, responses])

  return (
    <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{client.caseName}</h1>
              <p className="text-sm text-gray-600">Case No. {client.caseNumber}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                daysUntilDeadline <= 7 ? 'bg-red-100 text-red-700' :
                daysUntilDeadline <= 14 ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                <Clock size={16} />
                Due: {client.deadline}
              </div>
              <LogoutButton />
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === 'saving' && (
                    <>
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                      <span className="text-blue-600">Saving...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-green-600">Saved</span>
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <>
                      <AlertCircle size={16} className="text-red-500" />
                      <span className="text-red-600">Error saving</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* Progress bar in header - visible on all screen sizes */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">Form Progress</span>
                <span className={`text-xs font-semibold ${
                  progress === 100 ? 'text-green-600' :
                  progress >= 50 ? 'text-blue-600' :
                  progress > 0 ? 'text-yellow-600' :
                  'text-gray-400'
                }`}>
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    progress === 100 ? 'bg-green-500' :
                    progress >= 50 ? 'bg-blue-500' :
                    progress > 0 ? 'bg-yellow-500' :
                    'bg-gray-300'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Info box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-yellow-800 mb-2">Instructions</h2>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>Your responses are automatically saved as you type.</li>
              <li>You can close this form and return later to continue.</li>
              <li>Please answer all questions to the best of your ability.</li>
              <li>If you don't know an answer, you may leave it blank or write "unknown."</li>
              <li>Have a question? Click the <MessageCircle size={14} className="inline text-yellow-600" /> icon next to any field to add a comment. Your attorney will see it and can call to clarify.</li>
            </ul>
          </div>

          {/* Client info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800"><strong>Client:</strong> {client.clientName}</p>
            <p className="text-blue-800"><strong>Decedent:</strong> {client.decedent} (DOD: {client.decedentDOD})</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600">Loading your responses...</span>
            </div>
          ) : (
            <>
              {/* Sections */}
              <div className="space-y-4">
                {client.sections.map((section, index) => (
                  <Section
                    key={section.id}
                    section={section}
                    responses={responses}
                    onChange={handleChange}
                    disabled={false}
                    defaultExpanded={true}
                    dropboxLink={client.dropboxLink}
                    comments={comments}
                    onAddComment={handleAddComment}
                    onResolveComment={handleResolveComment}
                    role="client"
                  />
                ))}
              </div>

              {/* Confirmation box */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-500 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-green-800">Your responses are saved</h3>
                    <p className="text-sm text-green-700">
                      All your answers are automatically saved and will persist even if you close this page.
                      {lastSaved && ` Last saved: ${formatDate(lastSaved)}`}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
    </div>
  )
}

// Wrapper component that handles auth for client form
function ClientForm() {
  const { clientSlug } = useParams()
  const client = CLIENTS[clientSlug]
  const { isAuthenticated, canAccessClient } = useAuth()

  // If client doesn't exist, show error
  if (!client) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Client Not Found</h1>
          <p className="text-gray-600">The requested client form does not exist.</p>
        </div>
      </div>
    )
  }

  // If not authenticated or can't access this client, show login
  if (!isAuthenticated || !canAccessClient(clientSlug)) {
    return <LoginForm title={`${client.clientName} Portal`} clientSlug={clientSlug} />
  }

  return <ClientFormContent />
}

// ============================================================================
// REVIEW DASHBOARD (LIST ALL CLIENTS)
// ============================================================================

function ReviewDashboardContent() {
  const [clientsData, setClientsData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const { authFetch } = useAuth()

  useEffect(() => {
    const loadClientsData = async () => {
      try {
        // Fetch responses for each configured client
        const clientSlugs = Object.keys(CLIENTS)
        const responses = await Promise.all(
          clientSlugs.map(async (slug) => {
            try {
              const res = await authFetch(`/api/get-responses?clientSlug=${slug}`)
              if (res.ok) {
                const data = await res.json()
                return { slug, responses: data.responses || {}, updatedAt: data.updatedAt }
              }
            } catch (err) {
              console.error(`Failed to load responses for ${slug}:`, err)
            }
            return { slug, responses: {}, updatedAt: null }
          })
        )

        const dataMap = {}
        responses.forEach(({ slug, responses, updatedAt }) => {
          dataMap[slug] = { responses, updatedAt }
        })
        setClientsData(dataMap)
      } catch (err) {
        console.error('Failed to load clients:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadClientsData()
  }, [authFetch])

  // Build client list with progress
  const allClients = useMemo(() => {
    const merged = []
    for (const [slug, config] of Object.entries(CLIENTS)) {
      const data = clientsData[slug] || {}
      const progress = calculateProgress(config.sections, data.responses || {})
      const hasResponses = Object.keys(data.responses || {}).length > 0
      merged.push({
        slug,
        clientName: config.clientName,
        caseName: config.caseName,
        deadline: config.deadline,
        updatedAt: data.updatedAt || null,
        hasResponses,
        progress
      })
    }
    return merged.sort((a, b) => {
      if (a.updatedAt && b.updatedAt) return new Date(b.updatedAt) - new Date(a.updatedAt)
      if (a.updatedAt) return -1
      if (b.updatedAt) return 1
      return 0
    })
  }, [clientsData])

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Client Responses Review</h1>
            <p className="text-sm text-gray-600">View submitted interrogatory responses</p>
          </div>
          <LogoutButton />
        </div>
      </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600">Loading clients...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {allClients.map(client => (
                <div
                  key={client.slug}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/review/${client.slug}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-800">{client.clientName}</h2>
                      <p className="text-sm text-gray-600">{client.caseName}</p>
                      <p className="text-sm text-gray-500">Deadline: {client.deadline}</p>
                    </div>
                    <div className="text-right">
                      {client.hasResponses ? (
                        <>
                          <p className="text-xs text-gray-500">
                            Updated: {formatDate(client.updatedAt)}
                          </p>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          <Clock size={12} /> Not Started
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className={`text-sm font-semibold ${
                        client.progress === 100 ? 'text-green-600' :
                        client.progress >= 50 ? 'text-blue-600' :
                        client.progress > 0 ? 'text-yellow-600' :
                        'text-gray-400'
                      }`}>
                        {client.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          client.progress === 100 ? 'bg-green-500' :
                          client.progress >= 50 ? 'bg-blue-500' :
                          client.progress > 0 ? 'bg-yellow-500' :
                          'bg-gray-300'
                        }`}
                        style={{ width: `${client.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
                    <Eye size={16} className="mr-1" /> View Responses
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
    </div>
  )
}

// Wrapper for attorney-only review dashboard
function ReviewDashboard() {
  const { isAuthenticated, isAttorney } = useAuth()

  if (!isAuthenticated || !isAttorney) {
    return <LoginForm title="Attorney Review Portal" />
  }

  return <ReviewDashboardContent />
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

function formatResponsesAsText(client, responses) {
  let text = `# ${client.caseName}\n`
  text += `Case No. ${client.caseNumber}\n`
  text += `Client: ${client.clientName}\n`
  text += `Decedent: ${client.decedent} (DOD: ${client.decedentDOD})\n\n`
  text += `---\n\n`

  for (const section of client.sections) {
    text += `## ${section.title}\n\n`
    if (section.description) {
      text += `_${section.description}_\n\n`
    }

    for (const question of section.questions) {
      // Check showIf conditions
      if (question.showIf) {
        const parentValue = responses[question.showIf]
        const expectedValue = question.showIfValue !== undefined ? question.showIfValue : true
        if (parentValue !== expectedValue) continue
      }

      // Handle static fields specially - they use question.value, not responses
      if (question.type === 'static') {
        const rogLabel = question.rogRef ? ` [Rog ${question.rogRef}]` : ''
        text += `**${question.label}**${rogLabel}\n`
        text += question.value + '\n\n'
        continue
      }

      const value = responses[question.id]
      if (value === undefined || value === null || value === '') continue

      // Include interrogatory reference number if available
      const rogLabel = question.rogRef ? ` [Rog ${question.rogRef}]` : ''
      text += `**${question.label}**${rogLabel}\n`

      if (question.type === 'yesno') {
        text += value === true ? 'Yes' : value === false ? 'No' : ''
      } else if (question.type === 'multiselect' && Array.isArray(value)) {
        text += value.join(', ')
      } else if (question.type === 'checklist' && typeof value === 'object') {
        const checked = question.options.filter(opt => value[opt.id])
        if (checked.length > 0) {
          text += checked.map(opt => `- ${opt.label}`).join('\n')
        }
      } else if (question.type === 'repeatable' && Array.isArray(value)) {
        value.forEach((entry, idx) => {
          text += `\n  Entry ${idx + 1}:\n`
          for (const field of question.fields) {
            if (entry[field.id]) {
              text += `    ${field.label}: ${entry[field.id]}\n`
            }
          }
        })
      } else {
        text += String(value)
      }
      text += '\n\n'
    }
  }

  return text
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ============================================================================
// REVIEW CLIENT DETAIL (READ-ONLY)
// ============================================================================

function ReviewClientDetailContent() {
  const { clientSlug } = useParams()
  const client = CLIENTS[clientSlug]
  const { authFetch } = useAuth()
  const [responses, setResponses] = useState({})
  const [comments, setComments] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState(null)
  const [copyStatus, setCopyStatus] = useState('')
  const [currentCommentIndex, setCurrentCommentIndex] = useState(0)
  const navigate = useNavigate()

  // Get list of question IDs that have comments
  const commentQuestionIds = useMemo(() => {
    return Object.keys(comments).filter(qId => comments[qId]?.length > 0)
  }, [comments])

  // Scroll to a specific question
  const scrollToQuestion = useCallback((questionId) => {
    const element = document.getElementById(`question-${questionId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Highlight briefly
      element.classList.add('bg-yellow-100')
      setTimeout(() => element.classList.remove('bg-yellow-100'), 2000)
    }
  }, [])

  // Navigate to next/prev comment
  const goToComment = useCallback((direction) => {
    if (commentQuestionIds.length === 0) return
    let newIndex = currentCommentIndex + direction
    if (newIndex < 0) newIndex = commentQuestionIds.length - 1
    if (newIndex >= commentQuestionIds.length) newIndex = 0
    setCurrentCommentIndex(newIndex)
    scrollToQuestion(commentQuestionIds[newIndex])
  }, [commentQuestionIds, currentCommentIndex, scrollToQuestion])

  useEffect(() => {
    if (!client) return

    const loadData = async () => {
      try {
        const [responsesRes, commentsRes] = await Promise.all([
          authFetch(`/api/get-responses?clientSlug=${clientSlug}`),
          authFetch(`/api/get-messages?clientSlug=${clientSlug}`)
        ])

        if (responsesRes.ok) {
          const data = await responsesRes.json()
          if (data.responses) {
            setResponses(data.responses)
            setLastSaved(data.updatedAt)
          }
        }

        if (commentsRes.ok) {
          const data = await commentsRes.json()
          if (data.messages) {
            setComments(data.messages)
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [clientSlug, client, authFetch])

  // Add a comment on a field (attorney)
  const handleAddComment = useCallback(async (questionId, text) => {
    try {
      const res = await authFetch('/api/save-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSlug,
          questionId,
          role: 'attorney',
          text
        })
      })
      if (res.ok) {
        const data = await res.json()
        setComments(prev => ({
          ...prev,
          [questionId]: [...(prev[questionId] || []), data.message]
        }))
      }
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }, [clientSlug, authFetch])

  // Resolve (delete) a comment
  const handleResolveComment = useCallback(async (questionId, commentIndex) => {
    try {
      const res = await authFetch('/api/resolve-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSlug,
          questionId,
          commentIndex
        })
      })
      if (res.ok) {
        setComments(prev => ({
          ...prev,
          [questionId]: prev[questionId].filter((_, i) => i !== commentIndex)
        }))
      }
    } catch (err) {
      console.error('Failed to resolve comment:', err)
    }
  }, [clientSlug, authFetch])

  const handleDownloadJSON = () => {
    // Build rogRef mapping for easy interrogatory reference
    const rogRefMap = {}
    for (const section of client.sections) {
      for (const question of section.questions) {
        if (question.rogRef) {
          rogRefMap[question.id] = question.rogRef
        }
      }
    }

    const exportData = {
      client: {
        name: client.clientName,
        caseName: client.caseName,
        caseNumber: client.caseNumber,
        decedent: client.decedent,
        decedentDOD: client.decedentDOD,
        deadline: client.deadline
      },
      responses,
      interrogatoryReferences: rogRefMap,
      exportedAt: new Date().toISOString(),
      lastUpdated: lastSaved
    }
    const json = JSON.stringify(exportData, null, 2)
    downloadFile(json, `${clientSlug}-responses.json`, 'application/json')
  }

  const handleDownloadText = () => {
    const text = formatResponsesAsText(client, responses)
    downloadFile(text, `${clientSlug}-responses.md`, 'text/markdown')
  }

  const handleCopyToClipboard = async () => {
    const text = formatResponsesAsText(client, responses)
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('Copied!')
      setTimeout(() => setCopyStatus(''), 2000)
    } catch (err) {
      setCopyStatus('Failed to copy')
      setTimeout(() => setCopyStatus(''), 2000)
    }
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Client Not Found</h1>
          <p className="text-gray-600">The requested client does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-start mb-2">
            <button
              onClick={() => navigate('/review')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              &larr; Back to All Clients
            </button>
            <LogoutButton />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{client.clientName}</h1>
              <p className="text-sm text-gray-600">{client.caseName} - Case No. {client.caseNumber}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              <Eye size={16} /> Read-Only View
            </div>
          </div>
        </div>
      </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Info box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Eye className="text-purple-500 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-purple-800">Read-Only Mode</h3>
                <p className="text-sm text-purple-700">
                  This is a read-only view of the client's responses. Edits cannot be made from this screen.
                  {lastSaved && ` Last updated by client: ${formatDate(lastSaved)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Comments Summary */}
          {commentQuestionIds.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <MessageCircle className="text-yellow-600 mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800">Comments & Questions</h3>
                  <p className="text-sm text-yellow-700 mb-2">
                    There are comments on {commentQuestionIds.length} field(s). Click a badge to jump to that question.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {commentQuestionIds.map((questionId, idx) => (
                      <button
                        key={questionId}
                        onClick={() => {
                          setCurrentCommentIndex(idx)
                          scrollToQuestion(questionId)
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800 hover:bg-yellow-300 transition-colors cursor-pointer"
                      >
                        {questionId}
                        <span className="w-4 h-4 bg-yellow-500 rounded-full text-white text-[10px] flex items-center justify-center">
                          {comments[questionId].length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export buttons */}
          {Object.keys(responses).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Export Responses</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownloadJSON}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Download size={16} /> Download JSON (for AI)
                </button>
                <button
                  onClick={handleDownloadText}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Download size={16} /> Download Markdown
                </button>
                <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <Copy size={16} /> {copyStatus || 'Copy to Clipboard'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                JSON is ideal for feeding into AI tools. Markdown is formatted for easy reading and printing.
              </p>
            </div>
          )}

          {/* Client info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800"><strong>Client:</strong> {client.clientName}</p>
            <p className="text-blue-800"><strong>Decedent:</strong> {client.decedent} (DOD: {client.decedentDOD})</p>
            <p className="text-blue-800"><strong>Deadline:</strong> {client.deadline}</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600">Loading responses...</span>
            </div>
          ) : Object.keys(responses).length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <AlertCircle className="mx-auto text-yellow-500 mb-3" size={32} />
              <h3 className="font-semibold text-yellow-800">No Responses Yet</h3>
              <p className="text-sm text-yellow-700">The client has not submitted any responses.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {client.sections.map((section, index) => (
                <Section
                  key={section.id}
                  section={section}
                  responses={responses}
                  onChange={() => {}} // No-op for read-only
                  disabled={true}
                  defaultExpanded={true}
                  dropboxLink={client.dropboxLink}
                  comments={comments}
                  onAddComment={handleAddComment}
                  onResolveComment={handleResolveComment}
                  role="attorney"
                />
              ))}
            </div>
          )}

          {/* Floating Comment Navigator */}
          {commentQuestionIds.length > 0 && (
            <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-20">
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-yellow-700">{currentCommentIndex + 1}</span>
                  <span className="text-gray-400"> / {commentQuestionIds.length}</span>
                  <span className="ml-1 text-gray-500">comments</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => goToComment(-1)}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    title="Previous comment"
                  >
                    <ChevronUp size={18} />
                  </button>
                  <button
                    onClick={() => goToComment(1)}
                    className="p-2 rounded-lg bg-yellow-100 hover:bg-yellow-200 transition-colors text-yellow-700"
                    title="Next comment"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
    </div>
  )
}

// Wrapper for attorney-only client detail view
function ReviewClientDetail() {
  const { clientSlug } = useParams()
  const client = CLIENTS[clientSlug]
  const { isAuthenticated, isAttorney } = useAuth()

  // If client doesn't exist, show error
  if (!client) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Client Not Found</h1>
          <p className="text-gray-600">The requested client does not exist.</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isAttorney) {
    return <LoginForm title="Attorney Review Portal" />
  }

  return <ReviewClientDetailContent />
}

// ============================================================================
// MAIN APP WITH ROUTING
// ============================================================================

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/review" replace />} />
          <Route path="/review" element={<ReviewDashboard />} />
          <Route path="/review/:clientSlug" element={<ReviewClientDetail />} />
          <Route path="/:clientSlug" element={<ClientForm />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
