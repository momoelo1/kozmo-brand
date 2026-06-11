import './index.scss'
import logo from '../../../images/afd-logo-nero.png'

const Logo = ({logoClass}) => {
  return (
    <div className={logoClass}>
      <img src={logo} alt="main-logo" />
    </div>
  );
};

export default Logo
