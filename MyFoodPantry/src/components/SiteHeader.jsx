import Icon from "./Icon";
export default function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#">
        <span className="brand-icon">
          <Icon name="leaf" size={26} />
        </span>
        MyFridgePantry<span className="brand-period">.com</span>
      </a>
      <nav aria-label="Main navigation">
        <a className="active" href="#kitchen">
          My Kitchen
        </a>
        {/* <a href="#recipes">Recipe ideas</a> */}
      </nav>
    </header>
  );
}
