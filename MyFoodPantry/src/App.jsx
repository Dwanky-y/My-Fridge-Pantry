import { useState } from "react";
import useKitchen from "./hooks/useKitchen";
import SiteHeader from "./components/SiteHeader";
import Hero from "./components/Hero";
import KitchenPanel from "./components/KitchenPanel";
import RecipeBrowser from "./components/RecipeBrowser";
import RecipeDialog from "./components/RecipeDialog";
import PrivacyControls from "./components/PrivacyControls";
import Icon from "./components/Icon";
import "./App.css";
export default function App() {
  const kitchen = useKitchen();
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <PrivacyControls kitchen={kitchen} />
        <div className="workspace">
          <KitchenPanel kitchen={kitchen} />
          <RecipeBrowser items={kitchen.items} onSelect={setSelectedRecipe} />
        </div>
        <section className="bottom-note">
          <Icon name="leaf" size={24} />
          <p>
            Create something great with what you have
          </p>
          <small>...</small>
        </section>
      </main>
      <footer>
        <a className="footer-brand" href="#">
          MyFridgePantry<span className="brand-period">.com</span>
        </a>
        <span>Make the most of what you have.</span>
        <span>
          Recipes by Spoonacular. Your quantities stay on your device.
        </span>
      </footer>
      {selectedRecipe && (
        <RecipeDialog
          key={selectedRecipe.id}
          summary={selectedRecipe}
          kitchen={kitchen}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </>
  );
}
