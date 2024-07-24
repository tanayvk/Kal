const CircularProgress = ({ color = "text-violet-500", height = "" }) => (
  <div
    className={`${height || "h-full"} w-full flex items-center justify-center`}
  >
    <div
      className={`${color} inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]`}
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  </div>
);

export default CircularProgress;
