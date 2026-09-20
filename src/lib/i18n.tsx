import React, { createContext, useContext, useState, useEffect } from 'react'

export type SupportedLanguage = 'en' | 'hi'

export interface LanguageOption {
  code: SupportedLanguage
  label: string
  nativeName: string
  flag: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
]

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Top banner & Header
    'gov.india': 'Government of India',
    'min.railways': 'Ministry of Railways',
    'app.title': 'RAILBLOCK AI',
    'app.subtitle': 'Integrated Maintenance Block Planning & Decision Support System',
    'app.tagline': 'AI-Powered Automatic Block Planning for Railway Operations',
    'clock.ist': 'IST Control Clock',
    'lang.switch': 'Language',
    'sign.out': 'Sign Out',
    'sign.in': 'Sign In',

    // Roles & Clearances
    'role.admin': 'ADMIN (SR. DOM)',
    'role.ops': 'PLANNER (CONTROLLER)',
    'role.worker': 'WORKER (FIELD STAFF)',
    'role.admin_full': 'Senior Divisional Operations Manager (Sr. DOM)',
    'role.ops_full': 'Chief Section Controller (Traffic & Planning)',
    'role.worker_full': 'Senior Section Engineer (P-Way / Field Staff)',
    'role.admin_desc': 'Class-A Final Statutory Human Approval Authority • CP-SAT Optimization Tuning',
    'role.ops_desc': 'Real-Time Train Movements • Headway Regulation • Block Requests & Simulation',
    'role.worker_desc': 'Field Track Maintenance • Work Orders • USFD Defect Logs • Machine Slots',

    // Navigation
    'nav.dashboard': 'Control Dashboard',
    'nav.operations': 'OPERATIONS',
    'nav.trains': 'Train Operations',
    'nav.blocks': 'Block Planning',
    'nav.network': 'Schedule & National GIS',
    'nav.maintenance': 'MAINTENANCE',
    'nav.maint_requests': 'Maintenance Requests',
    'nav.assets': 'Asset Intelligence',
    'nav.alerts': 'Operational Alerts',
    'nav.resources': 'Operational Resources',
    'nav.ai_support': 'AI & DECISION SUPPORT',
    'nav.optimization': 'Plan Optimization',
    'nav.daily_plan': 'Daily Plan',
    'nav.weekly_plan': 'Weekly Plan',
    'nav.monthly_plan': 'Monthly Plan',
    'nav.simulation': 'What-If Simulation',
    'nav.scenarios': 'Scenario Catalog',
    'nav.reports': 'Official Reports',
    'nav.admin_compliance': 'ADMINISTRATION & COMPLIANCE',
    'nav.users': 'User Management',
    'nav.settings': 'System Settings',
    'nav.audit': 'Audit Compliance',

    // Login Page
    'login.portal_title': 'RAILBLOCK AI',
    'login.portal_subtitle': 'AI-Powered Automatic Block Planning for Railway Operations',
    'login.gateway_notice': 'Official RailNet Operational Gateway • Multi-Tier Role-Based Clearance',
    'login.security_warning': 'Authorized personnel only. All access, approvals, and actions are cryptographically journaled under Indian Railways safety protocols.',
    'login.identity_label': 'Username or RailNet Email',
    'login.identity_placeholder': 'e.g. admin or admin@railnet.gov.in',
    'login.password_label': 'Password / Security PIN',
    'login.password_placeholder': 'Enter your official password',
    'login.show_password': 'Show password',
    'login.hide_password': 'Hide password',
    'login.captcha_label': 'Security Verification Code (CAPTCHA)',
    'login.captcha_placeholder': 'Type characters shown above',
    'login.captcha_refresh': 'Generate new CAPTCHA code',
    'login.forgot_password': 'Forgot Password?',
    'login.btn_login': 'Sign In to RailBlock AI',
    'login.btn_authenticating': 'Verifying Credentials with RailNet...',
    'login.google_login': 'Sign In with Authorized Google Identity',
    'login.google_note': 'Pre-registered RailNet emails only',
    'login.credentials_guide_title': 'Authorized Test Accounts Reference Guide',
    'login.credentials_guide_subtitle': 'Click "Fill Credentials" to populate credentials. The backend verifies the password hash and determines the authorized role.',
    'login.fill_creds': 'Fill Credentials',
    'login.error_missing': 'Please provide both username/email and password.',
    'login.error_captcha': 'CAPTCHA code mismatch. Please re-enter the characters shown.',
    'login.error_invalid': 'Invalid railway credentials. Verification failed in RailNet directory.',

    // Forgot / Reset Password Modal
    'pwd.modal_title': 'Security PIN & Password Recovery',
    'pwd.step1_title': 'Step 1: Verify Registered Email',
    'pwd.step1_desc': 'Enter your official railway email to generate a 6-digit verification code.',
    'pwd.step2_title': 'Step 2: Enter Verification Code & New Password',
    'pwd.btn_send_code': 'Send Verification Code',
    'pwd.btn_reset': 'Update Password',
    'pwd.code_label': '6-Digit Verification Code',
    'pwd.new_pass_label': 'New Password',
    'pwd.success_msg': 'Password updated successfully! You can now log in.',

    // User Management (Admin Only)
    'users.title': 'Personnel & Role-Based Access Control',
    'users.subtitle': 'Manage railway officers, assign clearance roles (ADMIN, PLANNER, WORKER), and audit permissions.',
    'users.create_btn': 'Create Personnel Account',
    'users.change_role_btn': 'Change Role',
    'users.col_name': 'Officer Name',
    'users.col_username': 'Username / Email',
    'users.col_role': 'Assigned Role',
    'users.col_dept': 'Department & Division',
    'users.col_clearance': 'Clearance Tier',
    'users.col_status': 'Status',
    'users.col_last_login': 'Last Authentication',
    'users.col_actions': 'Actions',
    'users.modal_role_title': 'Modify Officer Role & Clearances',
    'users.modal_role_desc': 'Changing an officer role updates permissions across all active sessions and writes an immutable audit record.',
    'users.select_role': 'Select New Role',
    'users.role_admin_option': 'ADMIN — Senior DOM / Executive Approval Authority',
    'users.role_planner_option': 'PLANNER — Section Controller / Traffic Scheduling',
    'users.role_worker_option': 'WORKER — Senior Section Engineer (P-Way / Field)',
    'users.btn_save_role': 'Update Role Sanction',
    'users.admin_only_banner': 'Restricted to Senior Divisional Operations Managers (Sr. DOM) under CRIS security standards.',

    // Common Buttons & Tooltips
    'btn.approve': 'Sanction Block',
    'btn.reject': 'Reject Block',
    'btn.optimize': 'Run CP-SAT Solver',
    'btn.new_block': 'Propose Block',
    'btn.new_task': 'Log Maintenance Order',
    'btn.export': 'Export Report',
    'btn.filter': 'Filter',
    'btn.reset': 'Reset',
    'btn.close': 'Close',
    'btn.cancel': 'Cancel',
    'btn.save': 'Save Changes',
    'btn.details': 'View Details',

    // Tooltip explanations
    'tt.lang': 'Change platform interface language (English / हिन्दी)',
    'tt.clock': 'Coordinated Indian Standard Time (IST) synced with CRIS RailNet NTP servers',
    'tt.logout': 'Securely end session and return to authentication gateway',
    'tt.mobile_menu': 'Toggle mobile and tablet navigation menu',

    // Plan Optimization
    'plan.title': 'Unified Multi-Horizon Plan Optimization Engine',
    'plan.subtitle': 'Autonomous discrete optimization across Daily, Weekly, and Monthly operational horizons.',
    'plan.daily': 'Daily Plan',
    'plan.weekly': 'Weekly Plan',
    'plan.monthly': 'Monthly Plan',
    'plan.run_ai': 'Run AI Optimization',
    'plan.save': 'Save Plan',
    'plan.approve': 'Approve Plan',
    'plan.publish': 'Publish Plan',
    'plan.export': 'Export Plan',
    'plan.compare': 'Compare Versions',
    'plan.conflicts': 'Detected Conflicts',
    'plan.timetable': 'Optimized Timetable',
  },

  hi: {
    // Top banner & Header
    'gov.india': 'भारत सरकार',
    'min.railways': 'रेल मंत्रालय',
    'app.title': 'रेल-ब्लॉक एआई',
    'app.subtitle': 'एकीकृत रखरखाव ब्लॉक योजना एवं निर्णय सहायता प्रणाली',
    'app.tagline': 'रेलवे परिचालन हेतु एआई-संचालित स्वचालित ब्लॉक योजना प्रणाली',
    'clock.ist': 'भारतीय मानक समय (IST) घड़ी',
    'lang.switch': 'भाषा',
    'sign.out': 'लॉग आउट',
    'sign.in': 'लॉग इन',

    // Roles & Clearances
    'role.admin': 'प्रशासक (वरिष्ठ डी.ओ.एम.)',
    'role.ops': 'नियोजक (अनुभाग नियंत्रक)',
    'role.worker': 'फील्ड स्टाफ (एस.एस.ई. पी-वे)',
    'role.admin_full': 'वरिष्ठ मंडल परिचालन प्रबंधक (Sr. DOM)',
    'role.ops_full': 'मुख्य अनुभाग नियंत्रक (यातायात एवं योजना)',
    'role.worker_full': 'वरिष्ठ अनुभाग अभियंता (पी-वे / इंजीनियरिंग)',
    'role.admin_desc': 'वर्ग-ए सांविधिक मानवीय स्वीकृति प्राधिकारी • सीपी-सैट ऑप्टिमाइज़ेशन ट्यूनिंग',
    'role.ops_desc': 'वास्तविक समय ट्रेन संचलन • समयबद्धता • ब्लॉक अनुरोध एवं सिमुलेशन',
    'role.worker_desc': 'ट्रैक रखरखाव कार्य • दोष लॉग • मशीन स्लॉट अनुरोध',

    // Navigation
    'nav.dashboard': 'नियंत्रण डैशबोर्ड',
    'nav.operations': 'परिचालन',
    'nav.trains': 'ट्रेन परिचालन',
    'nav.blocks': 'ब्लॉक योजना',
    'nav.network': 'समय-सारणी एवं राष्ट्रीय जीआईएस',
    'nav.maintenance': 'रखरखाव',
    'nav.maint_requests': 'रखरखाव अनुरोध',
    'nav.assets': 'परिसंपत्ति सूचना',
    'nav.alerts': 'परिचालन अलर्ट',
    'nav.resources': 'परिचालन संसाधन',
    'nav.ai_support': 'एआई एवं निर्णय सहायता',
    'nav.optimization': 'योजना अनुकूलन (CP-SAT)',
    'nav.daily_plan': 'दैनिक योजना',
    'nav.weekly_plan': 'साप्ताहिक योजना',
    'nav.monthly_plan': 'मासिक योजना',
    'nav.simulation': 'सिमुलेशन विश्लेषण',
    'nav.scenarios': 'परिदृश्य सूची',
    'nav.reports': 'आधिकारिक रिपोर्ट',
    'nav.admin_compliance': 'प्रशासन एवं अनुपालन',
    'nav.users': 'उपयोगकर्ता प्रबंधन',
    'nav.settings': 'सिस्टम सेटिंग्स',
    'nav.audit': 'सुरक्षा ऑडिट रिकॉर्ड',

    // Login Page
    'login.portal_title': 'रेल-ब्लॉक एआई (RAILBLOCK AI)',
    'login.portal_subtitle': 'रेलवे परिचालन हेतु एआई-संचालित स्वचालित ब्लॉक योजना प्रणाली',
    'login.gateway_notice': 'आधिकारिक रेलनेट परिचालन प्रवेश द्वार • बहु-स्तरीय भूमिका-आधारित सुरक्षा',
    'login.security_warning': 'केवल अधिकृत अधिकारियों के लिए। भारतीय रेल सुरक्षा नियमों के अंतर्गत सभी स्वीकृतियों और गतिविधियों का क्रिप्टोग्राफिक रिकॉर्ड रखा जाता है।',
    'login.identity_label': 'उपयोगकर्ता नाम या रेलनेट ईमेल',
    'login.identity_placeholder': 'जैसे: admin या admin@railnet.gov.in',
    'login.password_label': 'पासवर्ड / सुरक्षा पिन',
    'login.password_placeholder': 'अपना आधिकारिक पासवर्ड दर्ज करें',
    'login.show_password': 'पासवर्ड देखें',
    'login.hide_password': 'पासवर्ड छिपाएं',
    'login.captcha_label': 'सुरक्षा सत्यापन कोड (कॅप्चा)',
    'login.captcha_placeholder': 'ऊपर दिखाए गए अक्षर दर्ज करें',
    'login.captcha_refresh': 'नया कॅप्चा कोड प्राप्त करें',
    'login.forgot_password': 'पासवर्ड भूल गए?',
    'login.btn_login': 'रेल-ब्लॉक एआई में प्रवेश करें',
    'login.btn_authenticating': 'रेलनेट क्रेडेंशियल्स का सत्यापन हो रहा है...',
    'login.google_login': 'अधिकृत गूगल पहचान से साइन इन करें',
    'login.google_note': 'केवल पूर्व-पंजीकृत रेलनेट ईमेल खातों के लिए',
    'login.credentials_guide_title': 'अधिकृत परीक्षण खातों की संदर्भ गाइड',
    'login.credentials_guide_subtitle': 'खाता विवरण भरने के लिए "क्रेडेंशियल्स भरें" पर क्लिक करें। बैकएंड पासवर्ड हैश का सत्यापन कर अधिकृत भूमिका तय करता है।',
    'login.fill_creds': 'क्रेडेंशियल्स भरें',
    'login.error_missing': 'कृपया उपयोगकर्ता नाम/ईमेल और पासवर्ड दोनों दर्ज करें।',
    'login.error_captcha': 'कॅप्चा कोड गलत है। कृपया ऊपर दिखाए गए अक्षर पुनः दर्ज करें।',
    'login.error_invalid': 'अमान्य रेलवे क्रेडेंशियल्स। रेलनेट डायरेक्टरी में सत्यापन विफल रहा।',

    // Forgot / Reset Password Modal
    'pwd.modal_title': 'सुरक्षा पिन एवं पासवर्ड पुनर्प्राप्ति',
    'pwd.step1_title': 'चरण 1: पंजीकृत ईमेल का सत्यापन',
    'pwd.step1_desc': '6 अंकों का सत्यापन कोड प्राप्त करने हेतु अपना आधिकारिक रेलनेट ईमेल दर्ज करें।',
    'pwd.step2_title': 'चरण 2: सत्यापन कोड एवं नया पासवर्ड दर्ज करें',
    'pwd.btn_send_code': 'सत्यापन कोड भेजें',
    'pwd.btn_reset': 'पासवर्ड अपडेट करें',
    'pwd.code_label': '6 अंकों का सत्यापन कोड',
    'pwd.new_pass_label': 'नया पासवर्ड',
    'pwd.success_msg': 'पासवर्ड सफलतापूर्वक अपडेट हो गया! अब आप लॉग इन कर सकते हैं।',

    // User Management (Admin Only)
    'users.title': 'कार्मिक एवं भूमिका-आधारित पहुँच नियंत्रण (RBAC)',
    'users.subtitle': 'रेल अधिकारियों का प्रबंधन करें, अधिकृत भूमिकाएं (ADMIN, PLANNER, WORKER) आवंटित करें एवं अनुमतियों का ऑडिट करें।',
    'users.create_btn': 'नया कार्मिक खाता बनाएं',
    'users.change_role_btn': 'भूमिका बदलें',
    'users.col_name': 'अधिकारी का नाम',
    'users.col_username': 'उपयोगकर्ता नाम / ईमेल',
    'users.col_role': 'आवंटित भूमिका',
    'users.col_dept': 'विभाग एवं मंडल',
    'users.col_clearance': 'सुरक्षा स्तर',
    'users.col_status': 'स्थिति',
    'users.col_last_login': 'अंतिम प्रमाणीकरण',
    'users.col_actions': 'कार्यवाही',
    'users.modal_role_title': 'अधिकारी की भूमिका एवं अनुमतियां संशोधित करें',
    'users.modal_role_desc': 'भूमिका बदलने पर सभी सक्रिय सत्रों में अनुमतियां तुरंत अपडेट हो जाती हैं और ऑडिट रिकॉर्ड दर्ज किया जाता है।',
    'users.select_role': 'नई भूमिका चुनें',
    'users.role_admin_option': 'प्रशासक (ADMIN) — वरिष्ठ डीओएम / अंतिम स्वीकृति प्राधिकारी',
    'users.role_planner_option': 'नियोजक (PLANNER) — अनुभाग नियंत्रक / यातायात योजना',
    'users.role_worker_option': 'कार्यकर्ता (WORKER) — वरिष्ठ अनुभाग अभियंता (पी-वे / फील्ड)',
    'users.btn_save_role': 'भूमिका स्वीकृति सहेजें',
    'users.admin_only_banner': 'यह पृष्ठ केवल वरिष्ठ मंडल परिचालन प्रबंधकों (Sr. DOM) के लिए आरक्षित है।',

    // Common Buttons & Tooltips
    'btn.approve': 'ब्लॉक स्वीकृत करें',
    'btn.reject': 'ब्लॉक अस्वीकृत करें',
    'btn.optimize': 'सीपी-सैट सॉल्वर चलाएं',
    'btn.new_block': 'ब्लॉक प्रस्तावित करें',
    'btn.new_task': 'रखरखाव आदेश दर्ज करें',
    'btn.export': 'रिपोर्ट निर्यात करें',
    'btn.filter': 'फ़िल्टर करें',
    'btn.reset': 'रीसेट',
    'btn.close': 'बंद करें',
    'btn.cancel': 'रद्द करें',
    'btn.save': 'परिवर्तन सहेजें',
    'btn.details': 'विवरण देखें',

    // Tooltip explanations
    'tt.lang': 'सिस्टम की भाषा बदलें (English / हिन्दी)',
    'tt.clock': 'भारतीय मानक समय (IST) रेलनेट एनटीपी सर्वर से समन्वयित',
    'tt.logout': 'सत्र समाप्त करें और लॉगिन स्क्रीन पर लौटें',
    'tt.mobile_menu': 'मोबाइल एवं टैबलेट नेविगेशन मेनू खोलें/बंद करें',

    // Plan Optimization
    'plan.title': 'एकीकृत बहु-स्तरीय योजना अनुकूलन इंजन',
    'plan.subtitle': 'दैनिक, साप्ताहिक और मासिक परिचालन क्षितिजों में स्वायत्त अनुकूलन।',
    'plan.daily': 'दैनिक योजना',
    'plan.weekly': 'साप्ताहिक योजना',
    'plan.monthly': 'मासिक योजना',
    'plan.run_ai': 'एआई अनुकूलन चलाएं',
    'plan.save': 'योजना सहेजें',
    'plan.approve': 'योजना स्वीकृत करें',
    'plan.publish': 'योजना प्रकाशित करें',
    'plan.export': 'योजना निर्यात करें',
    'plan.compare': 'संस्करणों की तुलना करें',
    'plan.conflicts': 'पाए गए विरोध',
    'plan.timetable': 'अनुकूलित समय-सारिणी',
  },
}

interface I18nContextType {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  t: (key: string, fallback?: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('railblock_language')
    if (saved === 'hi' || saved === 'en') {
      return saved
    }
    return 'en'
  })

  useEffect(() => {
    localStorage.setItem('railblock_language', language)
    document.documentElement.lang = language
  }, [language])

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang)
  }

  const t = (key: string, fallback?: string): string => {
    const currentDict = translations[language]
    if (currentDict && currentDict[key]) {
      return currentDict[key]
    }
    const englishDict = translations.en
    if (englishDict && englishDict[key]) {
      return englishDict[key]
    }
    return fallback || key
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) {
    return {
      language: 'en' as SupportedLanguage,
      setLanguage: () => {},
      t: (key: string, fallback?: string) => translations.en[key] || fallback || key,
    }
  }
  return context
}
