import carRapid from "../../images/car-rapid.png";
import "./index.scss";

const Loader = () => (
  <div className="loader-wrap">
    <img src={carRapid} alt="Loading…" className="loader-img" />
  </div>
);

export default Loader;
