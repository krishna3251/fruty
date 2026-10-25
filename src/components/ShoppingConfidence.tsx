import { MapPin, Truck, MessageCircle, ArrowUpRight } from "lucide-react";
import { enquiryWhatsApp } from "../lib/contact";
import { DELIVERY_CHARGE } from "../lib/catalogue";
export default function ShoppingConfidence() {
  return (
    <section
      className="shopping-confidence section-pad"
      aria-label="Shopping at a glance"
    >
      <div>
        <MapPin size={21} />
        <span>
          <strong>Hyderabad, this one’s for you.</strong>
          <small>Tropical Feast enquiries in Hyderabad only.</small>
        </span>
      </div>
      <div>
        <Truck size={21} />
        <span>
          <strong>₹{DELIVERY_CHARGE} delivery. Shown upfront.</strong>
          <small>One delivery charge for all jars in your enquiry.</small>
        </span>
      </div>
      <div>
        <MessageCircle size={21} />
        <span>
          <strong>A real conversation before you order.</strong>
          <small>Browse as a guest. Confirm stock & delivery in chat.</small>
        </span>
      </div>
      <a
        href={enquiryWhatsApp(
          "Hello! I’m in Hyderabad. Can you confirm delivery availability, timing, jar sizes and ingredients/allergens before I order?",
        )!}
        target="_blank"
        rel="noopener noreferrer"
      >
        Ask about delivery <ArrowUpRight size={16} />
      </a>
    </section>
  );
}
