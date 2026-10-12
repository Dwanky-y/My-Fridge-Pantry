export default function FoodArt({ type }) {
  return (
    <div className={`food-art ${type}`} aria-hidden="true">
      <div className="napkin" />
      <div className="plate">
        <div className="meal">
          {Array.from({ length: 13 }, (_, i) => (
            <span key={i} style={{ "--i": i }} />
          ))}
        </div>
        <div className="herb">✦</div>
      </div>
      <div className="fork">╎</div>
    </div>
  );
}
