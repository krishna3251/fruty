import type { Address } from "../lib/customer";
export default function AddressFields({
  value,
  onChange,
  saveLabel = false,
}: {
  value: Address;
  onChange: (v: Address) => void;
  saveLabel?: boolean;
}) {
  return (
    <div className="delivery-fields">
      {(saveLabel
        ? ["label", "recipient", "phone", "street", "locality", "pin"]
        : ["recipient", "phone", "street", "locality", "pin"]
      ).map((key) => {
        const k = key as keyof Address;
        const labels: Record<string, string> = {
          label: "Address label",
          recipient: "Recipient name",
          phone: "Mobile number",
          street: "House / street address",
          locality: "Hyderabad locality",
          pin: "PIN code",
        };
        return (
          <label key={key}>
            {labels[key]}
            <input
              required
              value={String(value[k] || "")}
              type={key === "phone" ? "tel" : "text"}
              autoComplete={
                (
                  {
                    recipient: "name",
                    phone: "tel",
                    street: "street-address",
                    locality: "address-level3",
                    pin: "postal-code",
                  } as Record<string, string>
                )[key] || "off"
              }
              inputMode={
                key === "phone" || key === "pin" ? "numeric" : undefined
              }
              maxLength={key === "pin" ? 6 : key === "phone" ? 16 : 250}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            />
          </label>
        );
      })}
      <p>
        Hyderabad, Telangana only. A valid PIN format does not confirm delivery
        coverage.
      </p>
      {saveLabel && (
        <label className="check-label">
          <input
            type="checkbox"
            checked={value.isDefault}
            onChange={(e) =>
              onChange({ ...value, isDefault: e.target.checked })
            }
          />
          Use as default address
        </label>
      )}
    </div>
  );
}
