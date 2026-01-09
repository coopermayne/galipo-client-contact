import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { HashRouter, Routes, Route, useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, ChevronUp, Plus, Trash2, Lock, Eye, Clock, CheckCircle, Loader2, AlertCircle, Download, Copy, Upload, ExternalLink, MessageCircle, X } from 'lucide-react'

// ============================================================================
// AUTHENTICATION
// ============================================================================

const ATTORNEY_PASSWORD = 'Atty3232'

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
    clientPassword: 'Pool2026',
    dropboxLink: 'https://www.dropbox.com/request/9hnjYKu87tKg0a8T8FD8',
    sections: [
      {
        id: 'basic-info',
        title: 'A. Your Basic Information',
        questions: [
          { id: 'fullName', type: 'text', label: 'Full legal name' },
          { id: 'hasOtherNames', type: 'yesno', label: 'Have you ever used any other names (maiden, nickname, alias)?' },
          { id: 'otherNamesList', type: 'repeatable', label: 'Other names used', showIf: 'hasOtherNames', fields: [
            { id: 'name', type: 'text', label: 'Name' },
            { id: 'datesUsed', type: 'text', label: 'Approximate dates used' }
          ]},
          { id: 'dateOfBirth', type: 'date', label: 'Date of birth' },
          { id: 'placeOfBirth', type: 'text', label: 'Place of birth (city, state, country)' },
          { id: 'currentAddress', type: 'textarea', label: 'Current address (street, city, state, zip)' },
          { id: 'timeAtCurrentAddress', type: 'text', label: 'How long have you lived at your current address?' },
          { id: 'hasPriorAddresses', type: 'yesno', label: 'Have you lived at any other addresses in the past 5 years?' },
          { id: 'priorAddresses', type: 'repeatable', label: 'Prior addresses', showIf: 'hasPriorAddresses', fields: [
            { id: 'address', type: 'textarea', label: 'Address' },
            { id: 'dates', type: 'text', label: 'Dates lived there (from - to)' }
          ]},
          { id: 'speaksEnglish', type: 'yesno', label: 'Do you speak English with ease?', defaultValue: true },
          { id: 'speaksEnglishLanguage', type: 'text', label: 'What language do you primarily speak?', showIf: 'speaksEnglish', showIfValue: false },
          { id: 'readsWritesEnglish', type: 'yesno', label: 'Do you read and write English with ease?', defaultValue: true },
          { id: 'readsWritesEnglishLanguage', type: 'text', label: 'What language do you primarily read and write?', showIf: 'readsWritesEnglish', showIfValue: false },
          { id: 'hasFelony', type: 'yesno', label: 'Have you ever been convicted of a felony?' },
          { id: 'felonyList', type: 'repeatable', label: 'Felony convictions', showIf: 'hasFelony', fields: [
            { id: 'offense', type: 'text', label: 'Offense' },
            { id: 'date', type: 'text', label: 'Date' },
            { id: 'location', type: 'text', label: 'Location (city, state)' }
          ]}
        ]
      },
      {
        id: 'relationship',
        title: 'B. Your Relationship to Dominick',
        questions: [
          { id: 'relationshipType', type: 'text', label: 'What is/was your relationship to Dominick?', placeholder: 'e.g., biological mother, adoptive mother, stepmother' },
          { id: 'knowsDominickAddresses', type: 'yesno', label: 'Do you know where Dominick lived in the past 10 years?' },
          { id: 'dominickAddresses', type: 'repeatable', label: "Dominick's addresses", showIf: 'knowsDominickAddresses', fields: [
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
        title: 'C. Financial Support from Dominick',
        questions: [
          { id: 'receivedFinancialSupport', type: 'yesno', label: 'Did Dominick provide you with financial support?' },
          { id: 'financialSupportDetails', type: 'repeatable', label: 'Financial support received', showIf: 'receivedFinancialSupport', fields: [
            { id: 'dates', type: 'text', label: 'Time period (from - to)' },
            { id: 'monthlyAmount', type: 'text', label: 'Approximate monthly amount' },
            { id: 'howProvided', type: 'text', label: 'How was it provided? (cash, check, Venmo, etc.)' }
          ]},
          { id: 'receivedPurchases', type: 'yesno', label: 'Did Dominick purchase anything for you?' },
          { id: 'purchaseDetails', type: 'repeatable', label: 'Items purchased by Dominick', showIf: 'receivedPurchases', fields: [
            { id: 'item', type: 'text', label: 'Item description' },
            { id: 'cost', type: 'text', label: 'Approximate cost' },
            { id: 'date', type: 'text', label: 'Approximate date' }
          ]},
          { id: 'receivedServices', type: 'yesno', label: 'Did Dominick provide household services for you (repairs, maintenance, etc.)?' },
          { id: 'servicesDetails', type: 'repeatable', label: 'Services provided by Dominick', showIf: 'receivedServices', fields: [
            { id: 'serviceType', type: 'text', label: 'Type of service' },
            { id: 'description', type: 'text', label: 'Description' },
            { id: 'frequency', type: 'text', label: 'How often?' }
          ]}
        ]
      },
      {
        id: 'shared-experiences',
        title: 'D. Relationship & Shared Experiences',
        questions: [
          { id: 'majorLifeEvents', type: 'yesno', label: "Did Dominick participate in major life events with you (birthdays, holidays, graduations, etc.)?" },
          { id: 'majorLifeEventsList', type: 'repeatable', label: 'Major life events with Dominick', showIf: 'majorLifeEvents', fields: [
            { id: 'event', type: 'text', label: 'Event type (birthday, holiday, graduation, etc.)' },
            { id: 'date', type: 'text', label: 'Approximate date' },
            { id: 'description', type: 'text', label: 'Description of Dominick\'s participation' }
          ]},
          { id: 'hadSocialEvents', type: 'yesno', label: 'Did you attend social events together (2013-2023)?' },
          { id: 'socialEvents', type: 'repeatable', label: 'Social events attended together', showIf: 'hadSocialEvents', fields: [
            { id: 'event', type: 'text', label: 'Event description' },
            { id: 'date', type: 'text', label: 'Approximate date' }
          ]},
          { id: 'hadVacations', type: 'yesno', label: 'Did you take any vacations or trips with Dominick?' },
          { id: 'vacationDetails', type: 'repeatable', label: 'Vacations/trips with Dominick', showIf: 'hadVacations', fields: [
            { id: 'location', type: 'text', label: 'Location' },
            { id: 'dates', type: 'text', label: 'Dates' }
          ]}
        ]
      },
      {
        id: 'dominick-background',
        title: 'E. Dominick\'s Background, Education & Career',
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
          { id: 'dominickPersonality', type: 'textarea', label: 'Describe Dominick\'s personality and character' }
        ]
      },
      {
        id: 'health-history',
        title: 'F. Dominick\'s Health & Medical History',
        questions: [
          { id: 'knowsHealthcareProviders', type: 'yesno', label: 'Do you know of any healthcare providers who treated Dominick?' },
          { id: 'healthcareProviders', type: 'repeatable', label: 'Healthcare providers', showIf: 'knowsHealthcareProviders', fields: [
            { id: 'name', type: 'text', label: 'Provider/facility name' },
            { id: 'address', type: 'text', label: 'Address' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'email', type: 'text', label: 'Email address' },
            { id: 'treatment', type: 'text', label: 'Type of treatment' }
          ]},
          { id: 'hadConditionAtIncident', type: 'yesno', label: 'Was Dominick diagnosed with any medical conditions?' },
          { id: 'conditionsList', type: 'repeatable', label: 'Medical conditions', showIf: 'hadConditionAtIncident', fields: [
            { id: 'condition', type: 'text', label: 'Condition name' },
            { id: 'datesDiagnosed', type: 'text', label: 'When diagnosed' },
            { id: 'treatment', type: 'text', label: 'Treatment received' }
          ]},
          { id: 'hadPrescriptions', type: 'yesno', label: 'Was Dominick taking any prescription medications?' },
          { id: 'prescriptionDetails', type: 'repeatable', label: 'Prescription medications', showIf: 'hadPrescriptions', fields: [
            { id: 'name', type: 'text', label: 'Medication name' },
            { id: 'dosage', type: 'text', label: 'Dosage' },
            { id: 'doctor', type: 'text', label: 'Prescribing doctor' }
          ]},
          { id: 'hadMentalHealthTreatment', type: 'yesno', label: 'Was Dominick ever a patient at a mental health facility or received mental health treatment?' },
          { id: 'mentalHealthHistory', type: 'repeatable', label: 'Mental health treatment', showIf: 'hadMentalHealthTreatment', fields: [
            { id: 'facility', type: 'text', label: 'Facility/provider name' },
            { id: 'location', type: 'text', label: 'Location' },
            { id: 'dates', type: 'text', label: 'Dates (from - to)' },
            { id: 'reason', type: 'text', label: 'Reason for treatment' },
            { id: 'description', type: 'textarea', label: 'Description of treatment' }
          ]},
          { id: 'wasIncarcerated', type: 'yesno', label: 'Was Dominick ever incarcerated?' },
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
        id: 'your-damages',
        title: 'G. Your Damages from Dominick\'s Death',
        description: 'In a wrongful death case, you may be entitled to compensation for certain types of losses. Please describe how Dominick\'s death has affected you.',
        questions: [
          { id: 'lossOfLoveDescription', type: 'textarea', label: 'Describe the loss of love, companionship, comfort, care, assistance, protection, affection, society, and moral support you have experienced since Dominick\'s death' },
          { id: 'relationshipBond', type: 'textarea', label: 'Describe the bond and relationship you had with Dominick. What made your relationship special?' },
          { id: 'howLifeChanged', type: 'textarea', label: 'How has your daily life changed since Dominick\'s death?' },
          { id: 'emotionalImpact', type: 'textarea', label: 'Describe the emotional and psychological impact of Dominick\'s death on you' },
          { id: 'soughtCounseling', type: 'yesno', label: 'Have you sought grief counseling or therapy since Dominick\'s death?' },
          { id: 'counselingDetails', type: 'repeatable', label: 'Counseling/therapy providers', showIf: 'soughtCounseling', fields: [
            { id: 'provider', type: 'text', label: 'Counselor/therapist name' },
            { id: 'facility', type: 'text', label: 'Facility/practice name' },
            { id: 'phone', type: 'text', label: 'Phone number' },
            { id: 'dates', type: 'text', label: 'Dates of treatment' }
          ]},
          { id: 'futureLosses', type: 'textarea', label: 'Describe any future losses you anticipate (e.g., Dominick not being present for future milestones, holidays, family events)' }
        ]
      },
      {
        id: 'prior-claims',
        title: 'H. Prior Claims & Lawsuits',
        questions: [
          { id: 'hasPriorLawsuits', type: 'yesno', label: 'Have you been involved in any lawsuits or claims in the past 10 years?' },
          { id: 'priorLawsuitsList', type: 'repeatable', label: 'Prior lawsuits/claims', showIf: 'hasPriorLawsuits', fields: [
            { id: 'caseName', type: 'text', label: 'Case name' },
            { id: 'court', type: 'text', label: 'Court' },
            { id: 'date', type: 'text', label: 'Date' },
            { id: 'outcome', type: 'text', label: 'Outcome' }
          ]},
          { id: 'hasWorkersComp', type: 'yesno', label: 'Have you ever filed a workers\' compensation claim?' },
          { id: 'workersCompList', type: 'repeatable', label: 'Workers\' compensation claims', showIf: 'hasWorkersComp', fields: [
            { id: 'employer', type: 'text', label: 'Employer' },
            { id: 'date', type: 'text', label: 'Date' },
            { id: 'injury', type: 'text', label: 'Injury' },
            { id: 'outcome', type: 'text', label: 'Outcome' }
          ]}
        ]
      },
      {
        id: 'funeral-expenses',
        title: 'I. Funeral & Burial Expenses',
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
        title: 'J. Insurance',
        questions: [
          { id: 'hadInsuranceCoverage', type: 'yesno', label: 'At the time of the incident, did you have any insurance that might cover damages from this incident?' },
          { id: 'insuranceCoverageList', type: 'repeatable', label: 'Insurance coverage', showIf: 'hadInsuranceCoverage', fields: [
            { id: 'coverageType', type: 'text', label: 'Type of coverage' },
            { id: 'company', type: 'text', label: 'Insurance company' },
            { id: 'policyNumber', type: 'text', label: 'Policy number' },
            { id: 'coverageLimits', type: 'text', label: 'Coverage limits' }
          ]},
          { id: 'wasLifeInsuranceBeneficiary', type: 'yesno', label: "Was Dominick's life insured with you as a beneficiary?" },
          { id: 'lifeInsuranceList', type: 'repeatable', label: 'Life insurance policies', showIf: 'wasLifeInsuranceBeneficiary', fields: [
            { id: 'company', type: 'text', label: 'Insurance company' },
            { id: 'policyNumber', type: 'text', label: 'Policy number' },
            { id: 'coverageAmount', type: 'text', label: 'Coverage amount' },
            { id: 'receivedPayment', type: 'text', label: 'Have you received payment? (Yes/No/Pending)' }
          ]}
        ]
      },
      {
        id: 'documents-checklist',
        title: 'K. Documents Checklist',
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
        title: 'L. Final Questions',
        questions: [
          { id: 'whoHelped', type: 'textarea', label: 'Who helped you prepare these responses?' },
          { id: 'anythingElse', type: 'textarea', label: 'Is there anything else you think is relevant to this case that we haven\'t asked about?' },
          { id: 'unableToLocate', type: 'textarea', label: 'Are there any documents you are unable to locate? If so, which ones and why?' },
          { id: 'additionalNotes', type: 'textarea', label: 'Any additional notes or messages for your attorney' }
        ]
      }
    ]
  }
}

const ATTORNEY_PASSWORD = ''

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
  return (
    <div className="flex gap-6">
      <label className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
        <input
          type="radio"
          name={`yesno-${Math.random()}`}
          checked={value === true}
          onChange={() => !disabled && onChange(true)}
          disabled={disabled}
          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
        />
        <span className="text-gray-700">Yes</span>
      </label>
      <label className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
        <input
          type="radio"
          name={`yesno-${Math.random()}`}
          checked={value === false}
          onChange={() => !disabled && onChange(false)}
          disabled={disabled}
          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
        />
        <span className="text-gray-700">No</span>
      </label>
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
// PASSWORD PROTECTION
// ============================================================================

function PasswordGate({ children, storageKey, correctPassword, title }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Auto-authenticate if no password is set
    if (!correctPassword) {
      setIsAuthenticated(true)
      return
    }
    const saved = sessionStorage.getItem(storageKey)
    if (saved === 'true') {
      setIsAuthenticated(true)
    }
  }, [storageKey, correctPassword])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password === correctPassword) {
      sessionStorage.setItem(storageKey, 'true')
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect password. Please try again.')
    }
  }

  if (isAuthenticated) {
    return children
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
          />
          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}
          <button type="submit" className="btn-primary w-full">
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}

// ============================================================================
// CLIENT FORM PAGE
// ============================================================================

function ClientForm() {
  const { clientSlug } = useParams()
  const client = CLIENTS[clientSlug]
  const [responses, setResponses] = useState({})
  const [comments, setComments] = useState({})
  const [saveStatus, setSaveStatus] = useState('idle') // idle, saving, saved, error
  const [lastSaved, setLastSaved] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load existing responses and comments
  useEffect(() => {
    if (!client) return

    const loadData = async () => {
      try {
        const [responsesRes, commentsRes] = await Promise.all([
          fetch(`/api/get-responses?clientSlug=${clientSlug}`),
          fetch(`/api/get-messages?clientSlug=${clientSlug}`)
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
  }, [clientSlug, client])

  // Auto-save function
  const saveResponses = useCallback(async (newResponses) => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/save-responses', {
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
  }, [clientSlug])

  // Handle field change with auto-save
  const handleChange = useCallback((questionId, value) => {
    const newResponses = { ...responses, [questionId]: value }
    setResponses(newResponses)
    saveResponses(newResponses)
  }, [responses, saveResponses])

  // Add a comment on a field
  const handleAddComment = useCallback(async (questionId, text) => {
    try {
      const res = await fetch('/api/save-message', {
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
  }, [clientSlug])

  // Resolve (delete) a comment
  const handleResolveComment = useCallback(async (questionId, commentIndex) => {
    try {
      const res = await fetch('/api/resolve-comment', {
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
  }, [clientSlug])

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
    <PasswordGate
      storageKey={`auth-${clientSlug}`}
      correctPassword={client.clientPassword}
      title="Client Portal"
    >
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
    </PasswordGate>
  )
}

// ============================================================================
// REVIEW DASHBOARD (LIST ALL CLIENTS)
// ============================================================================

function ReviewDashboard() {
  const [clientsData, setClientsData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadClientsData = async () => {
      try {
        // Fetch responses for each configured client
        const clientSlugs = Object.keys(CLIENTS)
        const responses = await Promise.all(
          clientSlugs.map(async (slug) => {
            try {
              const res = await fetch(`/api/get-responses?clientSlug=${slug}`)
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
  }, [])

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
    <PasswordGate
      storageKey="auth-attorney-review"
      correctPassword={ATTORNEY_PASSWORD}
      title="Attorney Review Portal"
    >
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-800">Client Responses Review</h1>
            <p className="text-sm text-gray-600">View submitted interrogatory responses</p>
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
    </PasswordGate>
  )
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

      const value = responses[question.id]
      if (value === undefined || value === null || value === '') continue

      text += `**${question.label}**\n`

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

function ReviewClientDetail() {
  const { clientSlug } = useParams()
  const client = CLIENTS[clientSlug]
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
          fetch(`/api/get-responses?clientSlug=${clientSlug}`),
          fetch(`/api/get-messages?clientSlug=${clientSlug}`)
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
  }, [clientSlug, client])

  // Add a comment on a field (attorney)
  const handleAddComment = useCallback(async (questionId, text) => {
    try {
      const res = await fetch('/api/save-message', {
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
  }, [clientSlug])

  // Resolve (delete) a comment
  const handleResolveComment = useCallback(async (questionId, commentIndex) => {
    try {
      const res = await fetch('/api/resolve-comment', {
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
  }, [clientSlug])

  const handleDownloadJSON = () => {
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
    <PasswordGate
      storageKey="auth-attorney-review"
      correctPassword={ATTORNEY_PASSWORD}
      title="Attorney Review Portal"
    >
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate('/review')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2"
            >
              &larr; Back to All Clients
            </button>
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
    </PasswordGate>
  )
}

// ============================================================================
// HOME PAGE
// ============================================================================

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Client Intake System</h1>
          <p className="text-gray-600">
            Secure portal for collecting interrogatory responses from clients in civil rights cases.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Attorney Pages</h2>
          <div className="space-y-2">
            <Link
              to="/review"
              className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              <span className="font-medium text-gray-800">/review</span>
              <span className="text-gray-500 text-sm ml-2">- View all client submissions</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Client Forms</h2>
          <div className="space-y-2">
            {Object.entries(CLIENTS).map(([slug, client]) => (
              <Link
                key={slug}
                to={`/${slug}`}
                className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <span className="font-medium text-gray-800">/{slug}</span>
                <span className="text-gray-500 text-sm ml-2">- {client.clientName}</span>
                <p className="text-xs text-gray-400 mt-1">{client.caseName}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ATTORNEY-PROTECTED WRAPPER
// ============================================================================

function AttorneyGate({ children }) {
  return (
    <PasswordGate
      storageKey="auth-attorney-review"
      correctPassword={ATTORNEY_PASSWORD}
      title="Attorney Access"
    >
      {children}
    </PasswordGate>
  )
}

// ============================================================================
// MAIN APP WITH ROUTING
// ============================================================================

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AttorneyGate><HomePage /></AttorneyGate>} />
        <Route path="/review" element={<AttorneyGate><ReviewDashboard /></AttorneyGate>} />
        <Route path="/review/:clientSlug" element={<AttorneyGate><ReviewClientDetail /></AttorneyGate>} />
        <Route path="/:clientSlug" element={<ClientForm />} />
      </Routes>
    </HashRouter>
  )
}
