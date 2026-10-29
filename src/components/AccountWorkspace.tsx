import { useState, type ReactNode } from "react";
import {
  ClipboardList,
  LockKeyhole,
  LogOut,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "../context/Session";
import AccountAvatar from "./AccountAvatar";
import CustomerDashboard, { type CustomerSection } from "./CustomerDashboard";

type AccountSection = CustomerSection | "profile";

export default function AccountWorkspace({
  signOut,
  leaving,
  error,
  profileControls,
}: {
  signOut: () => void;
  leaving: boolean;
  error: string;
  profileControls: ReactNode;
}) {
  const { profile } = useSession();
  const [section, setSection] = useState<AccountSection>("enquiries");
  const sections = [
    { id: "enquiries", label: "Enquiries", icon: ClipboardList },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "profile", label: "Profile & security", icon: LockKeyhole },
    { id: "privacy", label: "Privacy", icon: ShieldCheck },
  ] as const;
  return (
    <div className="account-workspace">
      <header className="account-identity">
        <AccountAvatar profile={profile} large />
        <div className="account-identity-copy">
          <span className="account-kicker">YOUR TROPICAL FEAST ACCOUNT</span>
          <h2>
            {profile?.displayName
              ? `Hi, ${profile.displayName}.`
              : "Welcome to your account."}
          </h2>
          <p>{profile?.email || "Manage your pantry in one place."}</p>
        </div>
        <button
          className="account-signout"
          disabled={leaving}
          onClick={signOut}
        >
          <LogOut size={16} /> {leaving ? "Signing out…" : "Sign out"}
        </button>
      </header>
      <p role="alert" className="form-error">
        {error}
      </p>
      <div className="account-workspace-body">
        <nav className="account-sections" aria-label="Account sections">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={section === id ? "active" : ""}
              aria-pressed={section === id}
              onClick={() => setSection(id)}
            >
              <Icon size={17} /> <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="account-content">
          <div hidden={section === "profile"}>
            <CustomerDashboard
              section={section === "profile" ? "enquiries" : section}
            />
          </div>
          {section === "profile" && (
            <section className="account-section account-security">
              <span className="account-kicker">ACCOUNT SETTINGS</span>
              <h3>Profile & security</h3>
              <p>Update your photo, email and sign-in methods.</p>
              <div className="account-clerk-profile">{profileControls}</div>
            </section>
          )}
        </div>
      </div>
      <p className="account-workspace-note">
        <ShieldCheck size={15} /> Your account uses essential sign-in cookies.{" "}
        <a href="/privacy">Privacy & storage</a>
      </p>
    </div>
  );
}
