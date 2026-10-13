import Icon from "./Icon";
import FoodArt from "./FoodArt";
export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">
          <span />
        </span>
        <h1>
          Create something delicious<span className="brand-period">.</span> 
          <br />
          <em>Already in your kitchen</em>
        </h1>
        <p>
          Give what's already in your fridge a shot
          <br /> Fill your kitchen, find your next favorite meal.
        </p>
      </div>
      <div className="hero-illustration" aria-hidden="true">
        {/* <div className="hero-circle">
          <FoodArt type="salad" />
        </div>
        <span className="floating-label label-two">
          <Icon name="leaf" size={16} /> made with what you have
        </span> */}
        <span className="spark spark-one">✧</span>
        <span className="spark spark-two">✳</span>
      </div>
    </section>
  );
}
