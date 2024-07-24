const Error = ({ text, height }) => (
  <div
    className={`${height || "h-full"} w-full flex items-center justify-center`}
  >
    <span className="text-violet-400">{text}</span>
  </div>
);
export default Error;
