import Icon from "./Icon";
import FoodArt from "./FoodArt";
export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">
          <span /> GOOD FOOD STARTS AT HOME
        </span>
        <h1>
          Something delicious.
          <br />
          <em>Already in your kitchen.</em>
        </h1>
        <p>
          Give your everyday ingredients a little inspiration.
          <br /> Fill your kitchen, find your next favorite meal.
        </p>
        <a href="#kitchen" className="hero-link">
          Let’s see what’s cooking <Icon name="arrow" size={18} />
        </a>
      </div>
      <div className="hero-illustration" aria-hidden="true">
        <span className="floating-label label-one">a pinch of possibility</span>
        <div className="hero-circle">
          <FoodArt type="salad" />
        </div>
        <span className="floating-label label-two">
          <Icon name="leaf" size={16} /> made with what you have
        </span>
        <span className="spark spark-one">✧</span>
        <span className="spark spark-two">✳</span>
      </div>
    </section>
  );
}
