import Icon from "./Icon";
export default function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#">
        <span className="brand-icon">
          <Icon name="leaf" size={26} />
        </span>
        little pantry<span className="brand-period">.</span>
      </a>
      <nav aria-label="Main navigation">
        <a className="active" href="#kitchen">
          My kitchen
        </a>
        <a href="#recipes">Recipe ideas</a>
      </nav>
      <span className="header-note">
        <span className="status-dot" /> A little less waste. A lot more taste.
      </span>
    </header>
  );
}
