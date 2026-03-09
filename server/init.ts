import { storage } from "./storage";
import { startCleanupCron } from "./services/dataCleanup";
import { log } from "./index";

const sampleSections = [
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
<p>Privacy is a fundamental human right. Organizations that respect privacy build trust with their users, comply with regulations, and reduce the risk of data breaches that can result in significant fines and reputational damage.</p>`,
    orderIndex: 0,
    estimatedMinutes: 10,
  },
  {
    title: "Understanding Data Lifecycle Management",
    description: "Explore how data flows through an organization from collection to deletion, and learn best practices at each stage.",
    content: `<h2>The Data Lifecycle</h2>
<p>Data lifecycle management (DLM) is the process of managing data throughout its entire lifespan, from creation and collection to archival and deletion. Understanding each phase helps organizations maintain compliance and minimize risk.</p>
<h3>Phases of the Data Lifecycle</h3>
<ol>
<li><strong>Collection</strong> - Gathering data from users, systems, or third parties with proper consent</li>
<li><strong>Storage</strong> - Securely storing data with encryption and access controls</li>
<li><strong>Processing</strong> - Using data for its intended purpose while maintaining accuracy</li>
<li><strong>Sharing</strong> - Transferring data to authorized parties through secure channels</li>
<li><strong>Archival</strong> - Moving inactive data to long-term storage with continued protection</li>
<li><strong>Deletion</strong> - Permanently and securely removing data when no longer needed</li>
</ol>
<h3>Best Practices</h3>
<ul>
<li>Maintain a data inventory to track what data you hold and where it resides</li>
<li>Apply the principle of data minimization at every stage</li>
<li>Establish clear retention policies aligned with legal and business requirements</li>
<li>Regularly audit data flows to identify and address vulnerabilities</li>
</ul>`,
    orderIndex: 1,
    estimatedMinutes: 12,
  },
  {
    title: "Privacy-Focused Design Principles",
    description: "Learn how to embed privacy into the design and architecture of systems and processes from the very beginning.",
    content: `<h2>Privacy by Design</h2>
<p>Privacy by Design is an approach that integrates privacy considerations into the design and architecture of IT systems, business practices, and organizational processes from the outset rather than as an afterthought.</p>
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
<p>Many regulations, including GDPR, grant individuals the "right to erasure." Organizations must be able to demonstrate that they can fully and permanently delete an individual's data upon valid request.</p>`,
    orderIndex: 3,
    estimatedMinutes: 13,
  },
  {
    title: "Compliance and Best Practices",
    description: "Review key regulatory frameworks and organizational best practices for maintaining ongoing privacy compliance.",
    content: `<h2>Regulatory Landscape</h2>
<p>Organizations must navigate a complex web of privacy regulations that vary by jurisdiction. Understanding the key frameworks helps ensure compliance and reduces legal risk.</p>
<h3>Major Regulations</h3>
<ul>
<li><strong>GDPR</strong> - The EU's General Data Protection Regulation, setting the global standard for data protection</li>
<li><strong>CCPA/CPRA</strong> - California's consumer privacy laws providing rights to residents of California</li>
<li><strong>HIPAA</strong> - US regulation governing the privacy of health information</li>
<li><strong>PIPEDA</strong> - Canada's federal privacy law for private-sector organizations</li>
</ul>
<h3>Organizational Best Practices</h3>
<ul>
<li>Appoint a Data Protection Officer (DPO) to oversee privacy compliance</li>
<li>Conduct regular privacy training for all employees</li>
<li>Establish a data breach response plan with clear roles and timelines</li>
<li>Perform periodic audits and assessments to identify compliance gaps</li>
<li>Maintain thorough documentation of all data processing activities</li>
</ul>
<h3>Building a Culture of Privacy</h3>
<p>Compliance is not a one-time effort. Organizations must foster a culture where privacy is everyone's responsibility. Regular training, clear policies, and leadership commitment are essential to maintaining a strong privacy posture over time.</p>`,
    orderIndex: 4,
    estimatedMinutes: 12,
  },
];

export async function initializeApp() {
  try {
    const count = await storage.getTrainingSectionCount();
    if (count === 0) {
      log("Seeding sample training sections...", "init");
      for (const section of sampleSections) {
        await storage.createTrainingSection(section);
      }
      log(`Seeded ${sampleSections.length} training sections`, "init");
    }

    startCleanupCron();
    log("Application initialized successfully", "init");
  } catch (error) {
    log(`Initialization error: ${error}`, "init");
  }
}
