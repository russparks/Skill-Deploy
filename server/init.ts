import { storage } from "./storage";
import { startCleanupCron } from "./services/dataCleanup";
import { log } from "./index";

const sampleSubjects = [
  {
    title: "Data Management",
    description: "Learn the fundamentals of data protection, lifecycle management, and secure handling practices.",
    icon: "database",
    orderIndex: 0,
  },
  {
    title: "Quality and Compliance",
    description: "Understand quality standards, regulatory compliance, and best practices for organisational governance.",
    icon: "shield-check",
    orderIndex: 1,
  },
];

const dataManagementSections = [
  {
    title: "Introduction to Privacy & Data Protection",
    description: "Learn the fundamentals of privacy and data protection, including key terminology and why safeguarding personal information is critical.",
    content: `<h2>What is Privacy & Data Protection?</h2>
<p>Privacy and data protection refer to the practices and policies that ensure personal information is collected, stored, processed, and shared responsibly. In an increasingly connected world, safeguarding personal data is both a legal obligation and an ethical imperative.</p>
<h3>Key Terminology</h3>
<ul>
<li><strong>Personal Data</strong> - Any information that can directly or indirectly identify an individual</li>
<li><strong>Data Subject</strong> - The individual whose personal data is being collected or processed</li>
<li><strong>Data Controller</strong> - The entity that determines the purposes and means of processing personal data</li>
<li><strong>Data Processor</strong> - The entity that processes data on behalf of the controller</li>
<li><strong>Consent</strong> - A freely given, informed, and unambiguous agreement by the data subject</li>
</ul>
<h3>Why Privacy Matters</h3>
<p>Privacy is a fundamental human right. Organisations that respect privacy build trust with their users, comply with regulations, and reduce the risk of data breaches that can result in significant fines and reputational damage.</p>`,
    orderIndex: 0,
    estimatedMinutes: 10,
    questions: [
      { questionText: "A Data Processor is the entity that determines the purposes and means of processing personal data.", correctAnswer: false, orderIndex: 0 },
      { questionText: "Consent must be freely given, informed, and unambiguous to be valid under data protection law.", correctAnswer: true, orderIndex: 1 },
    ],
  },
  {
    title: "Understanding Data Lifecycle Management",
    description: "Explore how data flows through an organisation from collection to deletion, and learn best practices at each stage.",
    content: `<h2>The Data Lifecycle</h2>
<p>Data lifecycle management (DLM) is the process of managing data throughout its entire lifespan, from creation and collection to archival and deletion. Understanding each phase helps organisations maintain compliance and minimise risk.</p>
<h3>Phases of the Data Lifecycle</h3>
<ol>
<li><strong>Collection</strong> - Gathering data from users, systems, or third parties with proper consent</li>
<li><strong>Storage</strong> - Securely storing data with encryption and access controls</li>
<li><strong>Processing</strong> - Using data for its intended purpose while maintaining accuracy</li>
<li><strong>Sharing</strong> - Transferring data to authorised parties through secure channels</li>
<li><strong>Archival</strong> - Moving inactive data to long-term storage with continued protection</li>
<li><strong>Deletion</strong> - Permanently and securely removing data when no longer needed</li>
</ol>
<h3>Best Practices</h3>
<ul>
<li>Maintain a data inventory to track what data you hold and where it resides</li>
<li>Apply the principle of data minimisation at every stage</li>
<li>Establish clear retention policies aligned with legal and business requirements</li>
<li>Regularly audit data flows to identify and address vulnerabilities</li>
</ul>`,
    orderIndex: 1,
    estimatedMinutes: 12,
    questions: [
      { questionText: "Data minimisation means collecting as much data as possible to ensure nothing is missed.", correctAnswer: false, orderIndex: 0 },
      { questionText: "Archival is the phase where inactive data is moved to long-term storage with continued protection.", correctAnswer: true, orderIndex: 1 },
    ],
  },
  {
    title: "Privacy-Focused Design Principles",
    description: "Learn how to embed privacy into the design and architecture of systems and processes from the very beginning.",
    content: `<h2>Privacy by Design</h2>
<p>Privacy by Design is an approach that integrates privacy considerations into the design and architecture of IT systems, business practices, and organisational processes from the outset rather than as an afterthought.</p>
<h3>The 7 Foundational Principles</h3>
<ol>
<li><strong>Proactive not Reactive</strong> - Anticipate and prevent privacy issues before they occur</li>
<li><strong>Privacy as the Default</strong> - Ensure personal data is automatically protected without requiring user action</li>
<li><strong>Privacy Embedded into Design</strong> - Build privacy into the core architecture, not as an add-on</li>
<li><strong>Full Functionality</strong> - Avoid unnecessary trade-offs between privacy and functionality</li>
<li><strong>End-to-End Security</strong> - Protect data throughout its entire lifecycle from collection to deletion</li>
<li><strong>Visibility and Transparency</strong> - Keep practices open, documented, and independently verifiable</li>
<li><strong>Respect for User Privacy</strong> - Keep the interests and rights of the individual at the forefront of every decision</li>
</ol>
<h3>Practical Application</h3>
<p>Conduct Privacy Impact Assessments (PIAs) for any new project involving personal data. Design user interfaces that clearly communicate data practices and provide meaningful choices to users.</p>`,
    orderIndex: 2,
    estimatedMinutes: 15,
    questions: [
      { questionText: "Privacy by Design means adding privacy features after a system has been built and deployed.", correctAnswer: false, orderIndex: 0 },
      { questionText: "One of the 7 foundational principles is that privacy should be the default setting, requiring no action from the user.", correctAnswer: true, orderIndex: 1 },
    ],
  },
  {
    title: "Implementing Secure Data Deletion",
    description: "Understand the importance of secure data deletion and learn practical techniques for permanently removing personal data.",
    content: `<h2>Why Secure Deletion Matters</h2>
<p>Simply deleting a file or database record does not guarantee that the data is permanently removed. Residual data can be recovered, posing significant privacy and compliance risks. Secure data deletion ensures that personal information is irreversibly destroyed.</p>
<h3>Deletion Techniques</h3>
<ul>
<li><strong>Logical Deletion</strong> - Marking records as deleted while retaining the data temporarily for recovery purposes</li>
<li><strong>Cryptographic Erasure</strong> - Destroying the encryption keys that protect the data, rendering it unreadable</li>
<li><strong>Physical Destruction</strong> - Physically destroying storage media to prevent any possibility of data recovery</li>
<li><strong>Overwriting</strong> - Writing random data over the original data multiple times to prevent forensic recovery</li>
</ul>
<h3>Implementing Automated Deletion</h3>
<ol>
<li>Define clear data retention periods based on legal and business requirements</li>
<li>Set up automated schedules to flag data approaching its retention deadline</li>
<li>Implement verification procedures to confirm successful deletion</li>
<li>Maintain audit logs of all deletion activities for compliance reporting</li>
</ol>
<h3>Regulatory Requirements</h3>
<p>Many regulations, including GDPR, grant individuals the "right to erasure." Organisations must be able to demonstrate that they can fully and permanently delete an individual's data upon valid request.</p>`,
    orderIndex: 3,
    estimatedMinutes: 13,
    questions: [
      { questionText: "Simply deleting a file from a computer guarantees the data is permanently and irrecoverably removed.", correctAnswer: false, orderIndex: 0 },
      { questionText: "Cryptographic erasure works by destroying the encryption keys, making the encrypted data unreadable.", correctAnswer: true, orderIndex: 1 },
    ],
  },
  {
    title: "Compliance and Best Practices",
    description: "Review key regulatory frameworks and organisational best practices for maintaining ongoing privacy compliance.",
    content: `<h2>Regulatory Landscape</h2>
<p>Organisations must navigate a complex web of privacy regulations that vary by jurisdiction. Understanding the key frameworks helps ensure compliance and reduces legal risk.</p>
<h3>Major Regulations</h3>
<ul>
<li><strong>GDPR</strong> - The EU's General Data Protection Regulation, setting the global standard for data protection</li>
<li><strong>CCPA/CPRA</strong> - California's consumer privacy laws providing rights to residents of California</li>
<li><strong>HIPAA</strong> - US regulation governing the privacy of health information</li>
<li><strong>PIPEDA</strong> - Canada's federal privacy law for private-sector organisations</li>
</ul>
<h3>Organisational Best Practices</h3>
<ul>
<li>Appoint a Data Protection Officer (DPO) to oversee privacy compliance</li>
<li>Conduct regular privacy training for all employees</li>
<li>Establish a data breach response plan with clear roles and timelines</li>
<li>Perform periodic audits and assessments to identify compliance gaps</li>
<li>Maintain thorough documentation of all data processing activities</li>
</ul>
<h3>Building a Culture of Privacy</h3>
<p>Compliance is not a one-time effort. Organisations must foster a culture where privacy is everyone's responsibility. Regular training, clear policies, and leadership commitment are essential to maintaining a strong privacy posture over time.</p>`,
    orderIndex: 4,
    estimatedMinutes: 12,
    questions: [
      { questionText: "GDPR only applies to companies based within the European Union.", correctAnswer: false, orderIndex: 0 },
      { questionText: "Appointing a Data Protection Officer (DPO) is considered a best practice for overseeing privacy compliance.", correctAnswer: true, orderIndex: 1 },
    ],
  },
];

const qualityComplianceSections = [
  {
    title: "Introduction to Quality Management Systems",
    description: "Understand the fundamentals of quality management systems and their role in organisational excellence.",
    content: `<h2>What is a Quality Management System?</h2>
<p>A Quality Management System (QMS) is a formalised system that documents processes, procedures, and responsibilities for achieving quality policies and objectives. It helps coordinate and direct an organisation's activities to meet customer and regulatory requirements.</p>
<h3>Key Components of a QMS</h3>
<ul>
<li><strong>Quality Policy</strong> - A statement of the organisation's commitment to quality and continuous improvement</li>
<li><strong>Quality Objectives</strong> - Measurable goals aligned with the quality policy</li>
<li><strong>Standard Operating Procedures</strong> - Documented step-by-step instructions for routine operations</li>
<li><strong>Document Control</strong> - Systems to manage the creation, approval, and distribution of documents</li>
<li><strong>Internal Audits</strong> - Regular reviews to ensure the QMS is functioning effectively</li>
</ul>
<h3>Benefits of a QMS</h3>
<p>A well-implemented QMS improves consistency, reduces waste, increases customer satisfaction, and ensures regulatory compliance. It provides a framework for continuous improvement that drives organisational performance.</p>`,
    orderIndex: 0,
    estimatedMinutes: 8,
    questions: [
      { questionText: "A Quality Management System is only concerned with the final product, not the processes that create it.", correctAnswer: false, orderIndex: 0 },
      { questionText: "Internal audits are a key component of a QMS, used to ensure the system is functioning effectively.", correctAnswer: true, orderIndex: 1 },
    ],
  },
  {
    title: "Regulatory Compliance Essentials",
    description: "Learn the core principles of regulatory compliance and how to maintain adherence to industry standards.",
    content: `<h2>Understanding Regulatory Compliance</h2>
<p>Regulatory compliance refers to the process by which organisations adhere to laws, regulations, guidelines, and specifications relevant to their business. Non-compliance can result in legal penalties, financial losses, and reputational damage.</p>
<h3>Core Compliance Principles</h3>
<ul>
<li><strong>Accountability</strong> - Clearly defined roles and responsibilities for compliance activities</li>
<li><strong>Transparency</strong> - Open communication about compliance status and any issues</li>
<li><strong>Documentation</strong> - Thorough records of all compliance-related activities and decisions</li>
<li><strong>Training</strong> - Regular education to ensure all staff understand their compliance obligations</li>
</ul>
<h3>Common Compliance Frameworks</h3>
<ul>
<li><strong>ISO 9001</strong> - International standard for quality management systems</li>
<li><strong>ISO 27001</strong> - Information security management standard</li>
<li><strong>ISO 14001</strong> - Environmental management systems standard</li>
</ul>
<h3>Maintaining Compliance</h3>
<p>Compliance is an ongoing effort. Organisations must stay informed of regulatory changes, conduct regular assessments, and update their practices accordingly. Building compliance into daily operations, rather than treating it as a separate activity, leads to better outcomes.</p>`,
    orderIndex: 1,
    estimatedMinutes: 8,
    questions: [
      { questionText: "Regulatory compliance is a one-time activity that only needs to be addressed during initial setup.", correctAnswer: false, orderIndex: 0 },
      { questionText: "ISO 9001 is an international standard specifically for quality management systems.", correctAnswer: true, orderIndex: 1 },
    ],
  },
  {
    title: "Continuous Improvement and Reporting",
    description: "Discover how to implement continuous improvement processes and effective compliance reporting.",
    content: `<h2>The Continuous Improvement Cycle</h2>
<p>Continuous improvement is the ongoing effort to enhance products, services, or processes. The most widely used framework is the Plan-Do-Check-Act (PDCA) cycle.</p>
<h3>PDCA Cycle</h3>
<ol>
<li><strong>Plan</strong> - Identify an opportunity for improvement and plan the change</li>
<li><strong>Do</strong> - Implement the change on a small scale to test it</li>
<li><strong>Check</strong> - Review the results, measure performance, and compare against expectations</li>
<li><strong>Act</strong> - If successful, implement the change on a wider scale; if not, refine and repeat</li>
</ol>
<h3>Effective Reporting</h3>
<ul>
<li><strong>Key Performance Indicators (KPIs)</strong> - Define measurable metrics that track compliance and quality performance</li>
<li><strong>Incident Reporting</strong> - Document and analyse any non-conformances or compliance breaches</li>
<li><strong>Management Reviews</strong> - Regular leadership reviews of compliance data and improvement initiatives</li>
<li><strong>Corrective Actions</strong> - Systematic approach to identifying root causes and preventing recurrence</li>
</ul>
<h3>Building a Culture of Improvement</h3>
<p>Encourage all team members to identify and report improvement opportunities. Recognise contributions to quality and compliance, and ensure that lessons learned are shared across the organisation.</p>`,
    orderIndex: 2,
    estimatedMinutes: 7,
    questions: [
      { questionText: "The PDCA cycle stands for Plan, Deploy, Control, Assess.", correctAnswer: false, orderIndex: 0 },
      { questionText: "Corrective actions involve identifying root causes and preventing recurrence of issues.", correctAnswer: true, orderIndex: 1 },
    ],
  },
];

export async function initializeApp() {
  try {
    const subjectCount = await storage.getTrainingSubjectCount();
    if (subjectCount === 0) {
      log("Seeding training subjects, sections, and questions...", "init");

      const createdSubjects = [];
      for (const subject of sampleSubjects) {
        const created = await storage.createTrainingSubject(subject);
        createdSubjects.push(created);
      }

      const dataManagementSubjectId = createdSubjects[0].id;
      const qualityComplianceSubjectId = createdSubjects[1].id;

      const existingSections = await storage.getAllTrainingSections();
      
      if (existingSections.length > 0) {
        for (const section of existingSections) {
          await storage.updateTrainingSection(section.id, { subjectId: dataManagementSubjectId });
        }
        for (const sectionData of dataManagementSections) {
          const matchingSection = existingSections.find(s => s.title === sectionData.title);
          if (matchingSection) {
            for (const q of sectionData.questions) {
              await storage.createSectionQuestion({ ...q, sectionId: matchingSection.id });
            }
          }
        }
      } else {
        for (const sectionData of dataManagementSections) {
          const { questions, ...sectionFields } = sectionData;
          const created = await storage.createTrainingSection({ ...sectionFields, subjectId: dataManagementSubjectId });
          for (const q of questions) {
            await storage.createSectionQuestion({ ...q, sectionId: created.id });
          }
        }
      }

      for (const sectionData of qualityComplianceSections) {
        const { questions, ...sectionFields } = sectionData;
        const created = await storage.createTrainingSection({ ...sectionFields, subjectId: qualityComplianceSubjectId });
        for (const q of questions) {
          await storage.createSectionQuestion({ ...q, sectionId: created.id });
        }
      }

      log(`Seeded ${sampleSubjects.length} subjects, sections, and questions`, "init");
    }

    startCleanupCron();
    log("Application initialized successfully", "init");
  } catch (error) {
    log(`Initialization error: ${error}`, "init");
  }
}
