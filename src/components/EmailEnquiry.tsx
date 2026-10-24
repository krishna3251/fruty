import { ArrowUpRight, Mail } from "lucide-react";
import { enquiryEmail, enquiryGmail } from "../lib/contact";
export default function EmailEnquiry({
  message,
  label = "Email enquiry",
  fallback = false,
  prominent = false,
}: {
  message?: string;
  label?: string;
  fallback?: boolean;
  prominent?: boolean;
}) {
  const gmail = enquiryGmail(message);
  if (!gmail) return null;
  return (
    <div className="email-enquiry-actions">
      <a
        className={prominent ? "basket-contact email-contact" : "text-link"}
        href={gmail}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Mail size={16} />
        {label}
        <ArrowUpRight size={15} />
      </a>
      {fallback && (
        <>
          <a className="email-app-link" href={enquiryEmail(message)!}>
            Use my email app instead
          </a>
          <small>
            Opens an editable draft. Sign in to Gmail if asked; review and send
            it yourself.
          </small>
        </>
      )}
    </div>
  );
}
