import { MapPin, Truck, MessageCircle, ArrowUpRight } from "lucide-react";

export default function ShoppingConfidence() {
  return (
    <section
      className="shopping-confidence section-pad"
      aria-label="Shopping at a glance"
    >
      <div>
        <MapPin size={21} />
        <span>
          <strong>Hyderabad enquiries</strong>
          <small>Check delivery coverage with us.</small>
        </span>
      </div>
      <div>
        <Truck size={21} />
        <span>
          <strong>₹150 standard delivery</strong>
          <small>Per order, not per jar.</small>
        </span>
      </div>
      <div>
        <MessageCircle size={21} />
        <span>
          <strong>Order with a conversation</strong>
          <small>Send your cart by WhatsApp or email.</small>
        </span>
      </div>
      <a href="/shipping">
        Delivery details <ArrowUpRight size={16} />
      </a>
    </section>
  );
}
