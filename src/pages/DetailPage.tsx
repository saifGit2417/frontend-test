import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchAbility,
  fetchEggGroup,
  fetchEncounters,
  fetchEvolutionChain,
  fetchGrowthRate,
  fetchMove,
  fetchPokemon,
  fetchPokemonForm,
  fetchPokemonSpecies,
  fetchType,
  type AbilityDetail,
  type EggGroup,
  type Encounter,
  type EvolutionChain,
  type GrowthRate,
  type MoveDetail,
  type Pokemon,
  type PokemonForm,
  type PokemonSpecies,
  type TypeDetail,
} from "../api/pokeapi";
import { formatName } from "../lib/format";
import { AbilitiesSection } from "./sections/AbilitiesSection";
import { EggGroupsSection } from "./sections/EggGroupsSection";
import { EncountersSection } from "./sections/EncountersSection";
import { EvolutionSection } from "./sections/EvolutionSection";
import { FormsSection } from "./sections/FormsSection";
import { GrowthRateSection } from "./sections/GrowthRateSection";
import { OverviewSection } from "./sections/OverviewSection";
import { SignatureMoveSection } from "./sections/SignatureMoveSection";
import { SpeciesSection } from "./sections/SpeciesSection";
import { TypeMatchupsSection } from "./sections/TypeMatchupsSection";

type DetailData = {
  pokemon: Pokemon;
  species: PokemonSpecies;
  evolution: EvolutionChain;
  types: TypeDetail[];
  abilities: AbilityDetail[];
  move: MoveDetail;
  encounters: Encounter[];
  growthRate: GrowthRate;
  eggGroups: EggGroup[];
  forms: PokemonForm[];
};

export function DetailPage() {
  const { name: pokemonName = "" } = useParams();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setData(null);
      setError(null);

      try {
        const pokemon = await fetchPokemon(pokemonName);
        const species = await fetchPokemonSpecies(pokemon.species.name);
        const evolution = await fetchEvolutionChain(
          species.evolution_chain.url,
        );

        const [
          types,
          abilities,
          move,
          growthRate,
          eggGroups,
          forms,
          encounters,
        ] = await Promise.all([
          Promise.all(pokemon.types.map((slot) => fetchType(slot.type.name))),
          Promise.all(
            pokemon.abilities.map((slot) => fetchAbility(slot.ability.name)),
          ),
          fetchMove(pokemon.moves[0].move.name),
          fetchGrowthRate(species.growth_rate.name),
          Promise.all(
            species.egg_groups.map((group) => fetchEggGroup(group.name)),
          ),
          Promise.all(pokemon.forms.map((form) => fetchPokemonForm(form.name))),
          fetchEncounters(pokemon.id),
        ]);

        if (cancelled) return;

        setData({
          pokemon,
          species,
          evolution,
          types,
          abilities,
          move,
          encounters,
          growthRate,
          eggGroups,
          forms,
        });
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load Pokémon");
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [pokemonName]);

  if (error) {
    return (
      <div className="page">
        <Link className="back-button" to="/">
          ← Back to list
        </Link>
        <div className="loading">Error loading Pokémon: {error}</div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="page">
        <Link className="back-button" to="/">
          ← Back to list
        </Link>
        <div className="loading">Loading {formatName(pokemonName)}...</div>
      </div>
    );
  }

  return (
    <div className="page page--detail">
      <Link className="back-button" to="/">
        ← Back to list
      </Link>

      <OverviewSection pokemon={data.pokemon} />
      <SpeciesSection species={data.species} />
      <EvolutionSection evolution={data.evolution} />
      <TypeMatchupsSection types={data.types} />
      <AbilitiesSection abilities={data.abilities} />
      <SignatureMoveSection move={data.move} />
      <EncountersSection encounters={data.encounters} />
      <GrowthRateSection growthRate={data.growthRate} />
      <EggGroupsSection eggGroups={data.eggGroups} />
      <FormsSection forms={data.forms} />
    </div>
  );
}
