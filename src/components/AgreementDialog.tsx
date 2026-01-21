import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface AgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "client" | "freelancer" | "terms";
}

const clientAgreement = `
# THEUNOiA LLP - CLIENT SERVICE AGREEMENT

This Client Service Agreement is made and executed between THEUNOiA LLP and Client.

## 1. Parties

This Agreement is entered into between:

**THEUNOiA LLP**, a Limited Liability Partnership registered under the Limited Liability Partnership Act, 2008, having its registered office at C/O NILKANTH, LAXMI NAGAR, CHANDRAPUR, MAHARASHTRA - 442401

AND

**Client** (You)

## 2. Scope of Services

- THEUNOiA LLP shall connect the Client with suitable student freelancers for assignments, projects, or professional services.
- THEUNOiA LLP acts as a facilitator and service provider, not as the executor of the work.

## 3. Project Details

- The project shall be awarded through a bidding process.
- It is expressly agreed that THEUNOiA LLP shall charge the Client a service commission of three percent (3%) on the base project value finalized between the Client and THEUNOiA LLP.
- In addition to the above commission, Goods and Services Tax (GST) at the applicable rate, currently eighteen percent (18%), shall be levied on the base project amount.
- The Client acknowledges that the commission and GST charged are lawful, mandatory, and non-negotiable.

## 4. Contract Value & Payment Understanding

- THEUNOiA LLP shall charge 5% (five percent) commission from the Client on the total contract value.
- Payments shall be made to THEUNOiA LLP, which will release the Freelancer's payment after deducting applicable commissions.

## 5. Client Obligations

- The Client shall provide clear instructions, requirements, and timelines.
- The Client shall not directly engage or pay the Freelancer outside THEUNOiA LLP during or after the project period.
- The Client shall review and approve work within a reasonable time.

## 6. Dispute Resolution & Authority

- In case of any dispute related to quality, delivery, payment, delay, or misunderstanding between the Client and the Freelancer, ONLY THEUNOiA LLP shall intervene and resolve the issue.
- The Client agrees to cooperate fully with THEUNOiA LLP during dispute resolution.
- THEUNOiA's decision shall be final and binding.

## 7. Limitation of Liability

- THEUNOiA LLP shall not be responsible for any indirect or consequential loss.
- THEUNOiA's role is limited to facilitation, payment management, and dispute resolution.

## 8. Termination

- THEUNOiA LLP reserves the right to terminate the Agreement if the Client violates terms or misuses the platform.
- Pending dues must be cleared upon termination.

## 9. Governing Law

This Agreement shall be governed by and interpreted in accordance with the laws of India, and courts at Chandrapur shall have exclusive jurisdiction.

## Non-Circumvention, Misconduct & Platform Rights Clause

Any attempt by the Client or the Freelancer to bypass THEUNOiA LLP, including direct engagement, payment, or communication outside the platform for the same or related work, shall be treated as a material breach of this Agreement. In such cases, THEUNOiA LLP shall not be responsible for any loss, fraud, misrepresentation, or damage suffered by either party. THEUNOiA LLP reserves the right to take appropriate action, including suspension or permanent banning of the concerned account, recovery of losses, and initiation of legal proceedings as per applicable laws of India.

## 10. Acceptance

By checking the agreement checkbox while posting a project, the Client confirms agreement to all terms stated herein.

---

**Contact:** official@theunoia.com | +91 6372414583
`;

const freelancerAgreement = `
# THEUNOiA LLP - FREELANCER AGREEMENT

This Freelancer Agreement is made and executed between THEUNOiA LLP and Student Freelancer.

## 1. Parties

This Agreement is entered into between:

**THEUNOiA LLP**, a Limited Liability Partnership registered under the Limited Liability Partnership Act, 2008, having its registered office at C/O NILKANTH, LAXMI NAGAR, CHANDRAPUR, MAHARASHTRA - 442401

AND

**Freelancer** (You)

## 2. Nature of Work

2.1 The Freelancer agrees to provide freelance services including assignments, projects, academic work, technical work, creative work, or any other services allotted through THEUNOiA LLP.

2.2 The Freelancer is an "independent contractor" and not an employee of THEUNOiA LLP.

## 3. Project Details

- The project shall be awarded through a bidding process.
- THEUNOiA LLP shall be entitled to charge a commission of five percent (5%) on the total project value as accepted or finalized through the bidding or approval process.
- Upon acceptance of the bid or finalization of the project amount, THEUNOiA LLP shall deduct five percent (5%) of the agreed project value as its commission, and the remaining amount, after such deduction, shall be released to the concerned student freelancer.
- The student freelancer expressly agrees that the commission charged by THEUNOiA LLP is towards platform facilitation, client acquisition, administrative support, compliance handling, and operational coordination.

## 4. Contract Value & Payment Terms

4.1 THEUNOiA LLP shall charge 3% (three percent) commission from the Freelancer on the total contract value.

4.2 The remaining amount shall be payable to the Freelancer after successful completion of work and approval by the Client.

4.3 Payments shall be processed only through THEUNOiA's approved payment method.

## 5. Obligations of the Freelancer

5.1 The Freelancer shall complete the work honestly, independently, and within the agreed timeline.

5.2 The Freelancer shall not share any client data, work material, or project details with third parties.

5.3 Any delay or failure in work must be immediately informed to THEUNOiA LLP.

## 6. Dispute Resolution & Authority

6.1 In case of any dispute, misunderstanding, delay, non-payment, or quality related issue between the Client and the Freelancer, ONLY THEUNOiA LLP shall have the authority to intervene, mediate, and resolve the matter.

6.2 The decision of THEUNOiA LLP shall be final and binding on the Freelancer.

## 7. Termination

7.1 THEUNOiA LLP reserves the right to terminate this Agreement in case of misconduct, breach of terms, or non-performance.

7.2 Upon termination, pending payments shall be settled after deducting applicable commission.

## 8. Acknowledgement

8.1 The Parties hereby acknowledge that they have read, understood, and agree to strictly adhere to all the terms and conditions.

8.2 Any modification or amendment to this Agreement shall be valid only if made in writing and duly approved by THEUNOiA LLP.

8.3 The Parties agree not to bypass or circumvent THEUNOiA LLP by engaging directly with each other for the same or similar work during the term of this Agreement.

## Non-Circumvention, Misconduct & Platform Rights Clause

Any attempt by the Client or the Freelancer to bypass THEUNOiA LLP, including direct engagement, payment, or communication outside the platform for the same or related work, shall be treated as a material breach of this Agreement. In such cases, THEUNOiA LLP shall not be responsible for any loss, fraud, misrepresentation, or damage suffered by either party. THEUNOiA LLP reserves the right to take appropriate action, including suspension or permanent banning of the concerned account, recovery of losses, and initiation of legal proceedings as per applicable laws of India.

## 9. Acceptance

By checking the agreement checkbox while placing a bid, the Freelancer confirms that they have read, understood, and agreed to all the terms of this Agreement.

---

**Contact:** official@theunoia.com | +91 6372414583
`;

const termsConditions = `
# TERMS & CONDITIONS
## M/S THEUNOiA LLP
Last Edited Date: 20.01.2026

## 1. Introduction & Legal Scope

These Terms & Conditions ("Terms") constitute a legally binding agreement between the user ("User") and M/S THEUNOiA LLP, a limited liability partnership duly incorporated and existing under the laws of India ("THEUNOiA"). These Terms govern the User's access to, registration on, and use of the THEUNOiA digital marketplace, including its website, mobile applications, dashboards, communication tools, and all related services (collectively, the "Platform").

By accessing, browsing, registering, or otherwise using the Platform in any manner, the User expressly acknowledges that they have read, understood, and agreed to be bound by these Terms, along with THEUNOiA's Privacy Policy and all applicable statutory laws, rules, regulations, and governmental notifications in force in India, including but not limited to:

- Information Technology Act, 2000
- Consumer Protection Act, 2019
- Copyright Act, 1957
- Arbitration and Conciliation Act, 1996

If you do not agree, you must discontinue use of the Platform.

These Terms apply to all Users of the Platform, whether acting as Buyers, Business Owners, Sellers, or Student Freelancers, and govern all interactions, transactions, and contractual relationships facilitated through the Platform. If the User does not agree with any part of these Terms or is unwilling to be legally bound by them, the User must immediately refrain from accessing or using the Platform. Continued use of the Platform shall constitute unequivocal acceptance of these Terms and acknowledgment of their enforceability under applicable Indian law.

## 2. Definitions

For the purposes of these Terms & Conditions, unless the context otherwise requires, the following words and expressions shall have the meanings assigned to them below:

- **Platform** – THEUNOiA web and mobile application
- **User** – Any registered individual or entity
- **Buyer / Business Owner** – User purchasing services
- **Seller / Student Freelancer** – User providing services
- **Contract** – Fixed-price service agreement accepted on the Platform

**Interpretation:**
- Words importing the singular shall include the plural and vice versa.
- Headings are for convenience only and shall not affect interpretation.
- References to statutes shall include amendments and re-enactments thereof.

## 3. Platform Role (Marketplace Disclaimer)

THEUNOiA operates solely as an online technology platform and marketplace intermediary that facilitates interactions between Buyers and Sellers/Student Freelancers for the purpose of discovering, communicating, and entering into independent service contracts. THEUNOiA's role is strictly limited to providing digital infrastructure, payment facilitation, and administrative tools, and does not extend to supervising, directing, controlling, or managing the performance of services offered or delivered by Users.

THEUNOiA does not act as an employer, employee, principal, agent, partner, joint venture, guarantor, or legal representative of any User. No employment relationship, agency relationship, partnership, or fiduciary relationship is created between THEUNOiA and any Buyer or Seller/Student Freelancer, or between Buyers and Sellers, as a result of the use of the Platform.

All contracts for services are entered into directly and exclusively between Buyers and Sellers/Student Freelancers. THEUNOiA is not a party to such contracts and shall not be responsible or liable for the execution, performance, quality, legality, safety, suitability, or completion of any services, nor for any representations, warranties, promises, or obligations made by Users to one another.

Users expressly acknowledge and agree that any disputes, claims, liabilities, damages, or losses arising out of or in connection with services rendered, deliverables exchanged, or contractual obligations shall be resolved solely between the concerned Users. To the fullest extent permitted under the Information Technology Act, 2000 and applicable intermediary guidelines, THEUNOiA disclaims all liability arising from User conduct, content, or contractual performance on the Platform.

This clause mirrors globally accepted marketplace standards (e.g., Fiverr, Upwork).

## 4. Eligibility & Account Responsibility

Access to and use of the Platform is permitted only to individuals and entities who are legally competent to enter into a binding contract under the Indian Contract Act, 1872. By registering on or using the Platform, the User represents and warrants that they are at least eighteen (18) years of age. Where a User is below the age of eighteen (18) years, access shall be permitted only upon obtaining verifiable consent of a parent or lawful guardian in accordance with the requirements of the Digital Personal Data Protection Act, 2023, and such parent or guardian shall be deemed responsible for the User's actions on the Platform.

Users agree to provide true, accurate, complete, and up-to-date information during registration and at all times while using the Platform. THEUNOiA reserves the right to verify User information and to suspend or terminate accounts where information is found to be false, misleading, incomplete, or outdated.

Each User is solely responsible for maintaining the confidentiality of their login credentials, passwords, and account access details, and for all activities conducted through their account, whether authorized or unauthorized. THEUNOiA shall not be liable for any loss, damage, or liability arising from unauthorized access to a User's account due to the User's failure to safeguard credentials or comply with security obligations.

Any instance of fraud, misrepresentation, misuse of the Platform, chargebacks, or violation of these Terms may result in immediate suspension or permanent termination of the User's account, forfeiture of pending amounts, and such further legal action as may be deemed appropriate under applicable law.

## 5. Contract Model

THEUNOiA facilitates only fixed-price service contracts between Buyers and Sellers/Student Freelancers. Under this model, the total contract consideration, scope of work, deliverables, milestones (if any), and timelines must be clearly defined and mutually agreed upon prior to contract acceptance. The Platform does not support hourly billing, time-based compensation, or any form of time-tracking mechanisms.

A contract shall be deemed to be legally valid, binding, and enforceable when the Buyer formally accepts the Seller's or Student Freelancer's proposal on the Platform and completes payment of the full contract value through the Platform's authorized payment gateway. Electronic acceptance and digital payment shall constitute valid consent under applicable Indian laws, including the Information Technology Act, 2000.

Once a contract is formed, both parties are legally obligated to perform their respective duties in accordance with the agreed terms. Any modification to the scope, pricing, or timelines must be mutually agreed upon by the Buyer and Seller through the Platform. THEUNOiA does not unilaterally alter contract terms and shall not be responsible for any consequences arising from off-platform or informal modifications not recorded on the Platform.

## 6. Payment Structure & Platform Fees

Upon acceptance of a Seller's or Student Freelancer's proposal, the Buyer is required to pay one hundred percent (100%) of the agreed fixed contract value in advance, along with a Buyer Commission Fee of three percent (3%) charged by THEUNOiA for platform facilitation services. All payments must be made exclusively through the Platform's authorized payment systems, in Indian Rupees (INR), and no work shall commence unless the full payment has been successfully received. THEUNOiA temporarily holds such payments in a limited escrow-style mechanism solely to facilitate secure transactions and does not act as a bank, financial institution, or trustee, nor does it pay interest on funds held.

Upon successful completion of the contracted services and confirmation or deemed acceptance by the Buyer, the Seller or Student Freelancer shall receive the contract consideration after deduction of a Freelancer Commission Fee of five percent (5%). Applicable Goods and Services Tax (GST) or other statutory levies shall be charged on Platform commission fees where required by law. Payouts are generally released within two (2) to five (5) working days, subject to banking processes, payment gateway settlements, holidays, or dispute resolution, and any such delays shall not be attributable to THEUNOiA.

### 6.1 Buyer Payment on Acceptance
Upon accepting a Freelancer's proposal, the Buyer must pay:
- 100% of the contract value
- 3% Buyer Commission Fee charged by the Platform

Payment must be made before work begins and is collected in INR.

### 6.2 Platform-Held Funds (Escrow-Style)
- All payments are held securely by the Platform
- THEUNOiA is not a bank
- Funds are held only to facilitate secure transactions

### 6.3 Freelancer Payout & Commission
Upon successful completion and approval:
- Freelancer receives contract value minus 5% Freelancer Commission Fee
- GST is applied where legally required
- Payouts are made in INR

### 6.4 Payout Timeline
Payouts are released 2–5 working days after:
- Work completion confirmation, and
- Successful Buyer payment

Delays due to banks, gateways, holidays, or disputes are not attributable to THEUNOiA.

## 7. Payment Gateway & Processing

All payments on the Platform shall be processed exclusively through THEUNOiA's authorized third-party payment gateway, currently Razorpay, using supported payment methods including UPI, debit cards, credit cards, wallets, and net banking. THEUNOiA does not store, process, or retain sensitive financial or payment instrument data of Users and relies entirely on the payment gateway's secure infrastructure and compliance standards. Any attempt to make or solicit payments outside the Platform is strictly prohibited and may result in immediate account suspension, forfeiture of amounts, and legal action, and THEUNOiA shall not be liable for any loss, fraud, or dispute arising from off-platform payment arrangements.

- Payments are processed exclusively via Razorpay
- Supported methods include UPI, cards, wallets, net banking
- THEUNOiA does not store sensitive payment data

Off-platform payments are strictly prohibited.

## 8. Non-Circumvention & Off-Platform Engagement

Users agree not to circumvent, bypass, or attempt to bypass the Platform by engaging in off-platform transactions with any Buyer or Seller first introduced through THEUNOiA, including exchanging contact details, entering into external agreements, or avoiding Platform fees. This restriction shall apply during the course of the engagement and for a period of twelve (12) months thereafter. Any violation of this clause may result in immediate account termination, forfeiture of pending payouts, recovery of avoided fees, and initiation of appropriate legal proceedings, and THEUNOiA shall not be liable for any disputes, losses, or damages arising from such off-platform engagements.

Users shall not bypass the Platform. Buyers and Freelancers must not:
- Engage off-platform with the same party introduced via THEUNOiA
- Exchange contact details for external work
- Avoid platform fees

This restriction applies during the engagement and for 12 months thereafter.

Violations may result in:
- Account termination
- Forfeiture of pending payouts
- Recovery of fees
- Legal action

## 9. Refund Policy & Dispute Resolution

A Buyer may request a refund only in cases where the contracted work is materially incomplete, does not conform to the agreed scope of work, is delivered after the agreed timeline without approved extension, or is materially deficient in quality. Any dispute or refund request must be raised through the Platform within fifteen (15) days from the date of final delivery or contract completion, failing which the work shall be deemed accepted. THEUNOiA reserves the right to require supporting evidence, including Platform communications, agreed scope, and submitted deliverables, for the purpose of evaluating such claims.

THEUNOiA may, at its discretion, constitute a neutral Dispute Resolution Committee (DRC) to review disputes between Users. Based on the evidence submitted, the DRC may determine full or partial refunds, release of payments to the Seller or Student Freelancer, or any equitable settlement deemed appropriate. Decisions of the DRC shall be final and binding on all parties. Platform fees may be refunded or retained at the sole discretion of THEUNOiA, and unreasonable or bad-faith rejection of work by a Buyer may result in payout being released to the Seller or Student Freelancer.

### 9.1 Grounds for Refund
Refunds may be requested if:
- Work is incomplete
- Deliverables do not meet agreed scope
- Deadlines are missed without approval
- Quality is materially deficient

### 9.2 Dispute Resolution Committee (DRC)
THEUNOiA may constitute a neutral DRC:
- Evidence reviewed: messages, scope, deliverables
- Decisions on refunds, payouts, or partial settlements are final and binding

### 9.3 Refund Rules
- Valid Buyer claims → partial or full refund
- Unreasonable Buyer rejection → payout may be released to Freelancer
- Platform fees may be refundable at DRC discretion

### 9.4 Refund Time Window
Disputes must be raised within 15 days of final delivery or contract end.

### B. Termination of Accounts
THEUNOiA reserves the right, at its sole discretion, to suspend or permanently terminate any User account, restrict access to the Platform, or withhold payouts where the User violates these Terms, applicable laws, community guidelines, or engages in fraudulent, abusive, or harmful conduct. Termination shall not affect accrued rights, outstanding disputes, or legal remedies available to THEUNOiA.

## 10. Taxes, GST & TDS

All transactions conducted on the Platform shall be denominated in Indian Rupees (INR). Goods and Services Tax (GST) or any other applicable indirect taxes shall be levied on THEUNOiA's commission fees in accordance with prevailing tax laws. Buyers and Sellers are solely responsible for determining, deducting, depositing, and reporting any applicable direct or indirect taxes, including Tax Deducted at Source (TDS), as may be required under Indian law, and THEUNOiA shall not be liable for any tax non-compliance, penalties, or interest arising from a User's failure to meet statutory tax obligations.

## 11. Intellectual Property

Users retain ownership of all content, materials, and intellectual property they create or upload to the Platform. By using the Platform, Users grant THEUNOiA a non-exclusive, worldwide, royalty-free license to host, display, reproduce, and promote such content solely for the purposes of operating, marketing, and improving the Platform. Any act of plagiarism, copyright infringement, or unauthorized use of third-party intellectual property may result in immediate account termination and legal action under applicable law.

- Users retain ownership of their content
- Users grant THEUNOiA a worldwide, royalty-free license to host, display, and promote content
- Plagiarism or infringement may result in termination and legal action

## 12. Community Guidelines

Users agree to communicate and conduct themselves in a respectful, lawful, and professional manner while using the Platform. Harassment, hate speech, abusive behaviour, misleading conduct, or any violation of applicable Indian laws or IT regulations is strictly prohibited. THEUNOiA reserves the right to issue warnings, suspend accounts, or permanently terminate access for violations of these guidelines.

Users must:
- Communicate respectfully
- Avoid harassment, hate speech, or abuse
- Follow Indian IT laws

Violations may lead to warnings, suspension, or termination.

## 13. Service Availability

THEUNOiA strives to ensure continuous availability of the Platform but does not guarantee uninterrupted or error-free operation. Access to the Platform may be temporarily suspended due to maintenance, technical issues, system upgrades, or events beyond reasonable control, including force majeure circumstances, and THEUNOiA shall not be liable for any loss arising from such interruptions.

THEUNOiA does not guarantee uninterrupted availability. Downtime may occur due to:
- Maintenance
- Technical failures
- Force majeure events

## 14. Limitation of Liability

To the maximum extent permitted under applicable law, THEUNOiA shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with the use of the Platform or services contracted between Users. THEUNOiA's total aggregate liability, if any, shall in no event exceed the total Platform fees paid by the concerned User to THEUNOiA in the six (6) months immediately preceding the event giving rise to the claim.

## 15. Indemnification

Users agree to indemnify, defend, and hold harmless THEUNOiA, its partners, officers, employees, and affiliates from and against any claims, damages, losses, liabilities, costs, or expenses (including reasonable legal fees) arising out of or related to breach of these Terms, violation of applicable laws, disputes between Users, misuse of the Platform, or infringement of intellectual property or third-party rights.

Users agree to indemnify and hold harmless THEUNOiA against:
- Contract breaches
- User disputes
- Legal violations
- IP infringement claims

## 16. Arbitration & Governing Law

In the event of any dispute, the parties agree to first attempt amicable resolution through mediation, failing which the dispute shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be Maharashtra, India, the proceedings shall be conducted in English, and these Terms shall be governed by and construed in accordance with the laws of India.

- Parties agree to mediation → arbitration before litigation
- Arbitration under Arbitration and Conciliation Act, 1996
- Seat: Maharashtra
- Governing law: Indian Law

## 17. Amendments & Final Provisions

THEUNOiA reserves the right to modify, amend, or update these Terms & Conditions at any time to reflect changes in law, business practices, or Platform functionality. Updated Terms shall be effective upon being posted on the Platform, and continued access to or use of the Platform after such updates shall constitute deemed acceptance of the revised Terms. If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

These Terms, together with the Privacy Policy and any additional guidelines or policies referenced herein, constitute the entire agreement between the User and THEUNOiA and supersede all prior communications, understandings, or agreements, whether oral or written, relating to the subject matter hereof.

THEUNOiA may update these Terms at any time. Continued use of the Platform constitutes acceptance of revised Terms.

## 18. Contact Details

For any queries, grievances, or legal notices relating to these Terms or the use of the Platform, Users may contact:

**M/S THEUNOiA LLP**
C/O Nilkanth, Laxmi Nagar
Chandrapur, Maharashtra – 442403, India

📧 support@theunoia.com
`;

export function AgreementDialog({ open, onOpenChange, type }: AgreementDialogProps) {
  const content = type === "client" ? clientAgreement : type === "freelancer" ? freelancerAgreement : termsConditions;
  const title = type === "client" ? "Client Service Agreement" : type === "freelancer" ? "Freelancer Agreement" : "Terms & Conditions";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {content.split('\n').map((line, index) => {
              if (line.startsWith('# ')) {
                return <h1 key={index} className="text-xl font-bold mt-6 mb-3 text-foreground">{line.replace('# ', '')}</h1>;
              } else if (line.startsWith('## ')) {
                return <h2 key={index} className="text-lg font-semibold mt-5 mb-2 text-foreground">{line.replace('## ', '')}</h2>;
              } else if (line.startsWith('- ')) {
                return <li key={index} className="ml-4 text-muted-foreground">{line.replace('- ', '')}</li>;
              } else if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={index} className="font-semibold text-foreground">{line.replace(/\*\*/g, '')}</p>;
              } else if (line.startsWith('---')) {
                return <hr key={index} className="my-4 border-border" />;
              } else if (line.trim()) {
                return <p key={index} className="text-muted-foreground mb-2">{line}</p>;
              }
              return null;
            })}
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
