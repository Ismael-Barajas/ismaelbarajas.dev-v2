interface Props {
  label: string;
  accent?: boolean;
}

const FormatPill = ({ label, accent }: Props) => {
  return (
    <span className={`c-pill ${accent ? "c-pill-accent" : ""}`}>{label}</span>
  );
};

export default FormatPill;
