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
  type: "client" | "freelancer";
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

export function AgreementDialog({ open, onOpenChange, type }: AgreementDialogProps) {
  const content = type === "client" ? clientAgreement : freelancerAgreement;
  const title = type === "client" ? "Client Service Agreement" : "Freelancer Agreement";

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
