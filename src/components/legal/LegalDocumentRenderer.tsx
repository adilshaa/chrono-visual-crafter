import React from "react";

interface ContactInfo {
  company: string;
  address: string;
  email: string;
  dpo?: string;
  support?: string;
  billing?: string;
  responseTime: string;
  businessHours?: string;
}

interface Subsection {
  title: string;
  content: string;
  items?: string[];
}

interface Section {
  id: string;
  title: string;
  content?: string | string[];
  items?: string[];
  subsections?: Subsection[];
  additionalContent?: string;
  contactInfo?: ContactInfo;
}

interface EffectiveNotice {
  title: string;
  content: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

interface LegalDocumentRendererProps {
  sections: Section[];
  effectiveNotice: EffectiveNotice;
}

const LegalDocumentRenderer: React.FC<LegalDocumentRendererProps> = ({
  sections,
  effectiveNotice,
}) => {
  const renderContent = (content: string | string[]) => {
    if (Array.isArray(content)) {
      return content.map((paragraph, index) => (
        <p key={index} className="text-white/80 mb-4 leading-relaxed">
          {paragraph}
        </p>
      ));
    }
    return <p className="text-white/80 mb-4 leading-relaxed">{content}</p>;
  };

  const renderItems = (items: string[]) => (
    <ul className="list-disc list-inside text-white/80 mb-6 space-y-2">
      {items.map((item, index) => (
        <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
      ))}
    </ul>
  );

  const renderContactInfo = (contactInfo: ContactInfo) => (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <p className="text-white/80 mb-2">
        <strong>Company:</strong> {contactInfo.company}
      </p>
      <p className="text-white/80 mb-2">
        <strong>Registered Address:</strong> {contactInfo.address}
      </p>
      {/* <p className="text-white/80 mb-2">
        <strong>Email:</strong> {contactInfo.email}
      </p>
      {contactInfo.dpo && (
        <p className="text-white/80 mb-2">
          <strong>Data Protection Officer:</strong> {contactInfo.dpo}
        </p>
      )}
      {contactInfo.support && (
        <p className="text-white/80 mb-2">
          <strong>Support:</strong> {contactInfo.support}
        </p>
      )} */}
      {/* {contactInfo.billing && (
        <p className="text-white/80 mb-2">
          <strong>Billing Inquiries:</strong> {contactInfo.billing}
        </p>
      )} */}
      {/* <p className="text-white/80 mb-2">
        <strong>Response Time:</strong> {contactInfo.responseTime}
      </p> */}
      {/* {contactInfo.businessHours && (
        <p className="text-white/80">
          <strong>Business Hours:</strong> {contactInfo.businessHours}
        </p>
      )} */}
    </div>
  );

  const renderSubsection = (subsection: Subsection, index: number) => (
    <div key={index} className="mb-6">
      <h3 className="text-xl font-semibold mb-3 text-white/90">
        {subsection.title}
      </h3>
      {renderContent(subsection.content)}
      {subsection.items && renderItems(subsection.items)}
    </div>
  );

  const renderSection = (section: Section, index: number) => (
    <section key={section.id} className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-white">
        {index + 1}. {section.title}
      </h2>

      {section.content && renderContent(section.content)}
      {section.items && renderItems(section.items)}
      {section.additionalContent && (
        <p className="text-white/80 mb-6 leading-relaxed">
          {section.additionalContent}
        </p>
      )}

      {section.subsections &&
        section.subsections.map((subsection, subIndex) =>
          renderSubsection(subsection, subIndex)
        )}

      {section.contactInfo && renderContactInfo(section.contactInfo)}
    </section>
  );

  return (
    <div className="prose prose-invert max-w-none">
      {sections.map((section, index) => renderSection(section, index))}

      <div
        className={
          effectiveNotice.bgColor === "blue-500/10"
            ? "bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mt-12"
            : "bg-green-500/10 border border-green-500/20 rounded-lg p-6 mt-12"
        }
      >
        <h3
          className={
            effectiveNotice.textColor === "blue-300"
              ? "text-lg font-semibold mb-2 text-blue-300"
              : "text-lg font-semibold mb-2 text-green-300"
          }
        >
          {effectiveNotice.title}
        </h3>
        <p className="text-white/80">{effectiveNotice.content}</p>
      </div>
    </div>
  );
};

export default LegalDocumentRenderer;
