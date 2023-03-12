import React, { useState, useEffect } from "react";

// https://stackoverflow.com/questions/54666401/how-to-use-throttle-or-debounce-with-react-hook

export default (value, timeout) => {
  const [state, setState] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setState(value), timeout);

    return () => clearTimeout(handler);
  }, [value, timeout]);

  return state;
};
