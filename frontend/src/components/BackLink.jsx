import { useNavigate } from "react-router-dom";

export default function Back() {
  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };
  return (
    <a className="link" onClick={handleBack}>
      Back
    </a>
  );
}
