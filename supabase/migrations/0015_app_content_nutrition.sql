-- Editable app content, read by the app at runtime (no release needed).
-- First use: the "Nutrition Guidance as per Your Cycle" guide, key 'nutrition_guide'.
--
-- To change the guide: edit the `data` JSON of the 'nutrition_guide' row in the
-- Supabase Table Editor and save. The app checks the shape and falls back to
-- the copy bundled in the app if anything is missing or malformed.

CREATE TABLE IF NOT EXISTS public.app_content (
  key        text PRIMARY KEY,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_content ENABLE ROW LEVEL SECURITY;

-- Anyone using the app may read it; only the dashboard / service role can write.
DROP POLICY IF EXISTS "app_content readable by app users" ON public.app_content;
CREATE POLICY "app_content readable by app users"
  ON public.app_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.app_content_touch()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS app_content_touch ON public.app_content;
CREATE TRIGGER app_content_touch
  BEFORE UPDATE ON public.app_content
  FOR EACH ROW EXECUTE FUNCTION public.app_content_touch();

-- Seed with the copy the app ships with. Re-running never overwrites edits.
INSERT INTO public.app_content (key, data)
VALUES ('nutrition_guide', $guide$
{
  "version": 1,
  "title": "Eat well, in tune with you.",
  "intro": "Small, nourishing choices. One phase at a time.",
  "disclaimer": "This guide offers general nutrition ideas to support everyday wellbeing. Your nutritional needs and cycle may be different. These suggestions are not a substitute for personalised medical or dietetic advice.",
  "careNote": "Please speak to a doctor if you have heavy bleeding, persistent tiredness, severe pain, or symptoms that disrupt your daily life.",
  "phases": {
    "menstrual": {
      "name": "Menstrual Phase",
      "label": "Period — Nourish & restore",
      "when": "Your period days",
      "timing": "Often around days 1–5, but it varies",
      "emoji": [
        "🍲",
        "🥬",
        "🍊"
      ],
      "imageAlt": "A warm bowl of dal with spinach, rice and an orange",
      "intro": "Your period is here, and you may be feeling tired, bloated, or low on energy. Let's focus on nourishing meals, staying hydrated, and giving your body some extra care.",
      "foods": [
        {
          "label": "Iron-rich foods",
          "joiner": "and",
          "items": [
            {
              "name": "dal"
            },
            {
              "name": "chana"
            },
            {
              "name": "rajma"
            },
            {
              "name": "spinach"
            },
            {
              "name": "sesame seeds",
              "contains": [
                "sesame"
              ]
            }
          ]
        },
        {
          "label": "Vitamin C-rich foods",
          "joiner": "and",
          "suffix": "to help your body absorb iron from plant foods",
          "items": [
            {
              "name": "amla"
            },
            {
              "name": "guava"
            },
            {
              "name": "oranges"
            },
            {
              "name": "lemon"
            }
          ]
        },
        {
          "label": "Protein",
          "joiner": "or",
          "items": [
            {
              "name": "paneer",
              "contains": [
                "dairy"
              ]
            },
            {
              "name": "eggs",
              "contains": [
                "egg"
              ],
              "diet": "egg"
            },
            {
              "name": "tofu",
              "contains": [
                "soy"
              ]
            },
            {
              "name": "curd",
              "contains": [
                "dairy"
              ]
            },
            {
              "name": "lentils"
            }
          ]
        },
        {
          "label": "Fluids",
          "joiner": "and",
          "items": [
            {
              "name": "water"
            },
            {
              "name": "soups"
            },
            {
              "name": "other drinks you enjoy"
            }
          ]
        }
      ],
      "meals": [
        {
          "slot": "Breakfast",
          "options": [
            {
              "id": "men-b-1",
              "text": "Vegetable poha with peanuts",
              "contains": [
                "peanut"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "men-b-2",
              "text": "Moong dal chilla with mint chutney",
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "men-b-3",
              "text": "Egg bhurji with whole-wheat roti",
              "contains": [
                "egg",
                "gluten"
              ],
              "diet": "egg",
              "source": "added"
            }
          ]
        },
        {
          "slot": "Lunch",
          "options": [
            {
              "id": "men-l-1",
              "text": "Dal, roti, sabzi and lemon",
              "contains": [
                "gluten"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "men-l-2",
              "text": "Dal, rice, sabzi and lemon",
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "men-l-3",
              "text": "Chicken curry with rice and spinach sabzi",
              "diet": "nonveg",
              "source": "added"
            }
          ]
        },
        {
          "slot": "Snack",
          "options": [
            {
              "id": "men-s-1",
              "text": "Guava with a handful of nuts",
              "contains": [
                "treenut",
                "peanut"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "men-s-2",
              "text": "Guava or an orange with roasted chana",
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "men-s-3",
              "text": "A boiled egg with a few orange slices",
              "contains": [
                "egg"
              ],
              "diet": "egg",
              "source": "added"
            }
          ]
        },
        {
          "slot": "Dinner",
          "options": [
            {
              "id": "men-d-1",
              "text": "Rajma rice or paneer with roti",
              "contains": [
                "dairy",
                "gluten"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "men-d-2",
              "text": "Rajma with rice and a side of salad",
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "men-d-3",
              "text": "Egg curry with rice",
              "contains": [
                "egg"
              ],
              "diet": "egg",
              "source": "added"
            }
          ]
        }
      ],
      "reminder": "You don't need to push through exhaustion. Eat regularly, rest when you need to, and choose warm, comforting meals if they make you feel better."
    },
    "follicular": {
      "name": "Follicular Phase",
      "label": "Follicular — Build balanced habits",
      "when": "After your period begins",
      "timing": "Continues until ovulation; overlaps with the period at first",
      "emoji": [
        "🥕",
        "🥗",
        "🌰"
      ],
      "imageAlt": "A colourful plate of vegetables, roti and dal with a few walnuts",
      "intro": "As your cycle moves forward, you may notice changes in your energy or appetite. This is a good time to keep your meals balanced and build simple habits that help you feel your best.",
      "foods": [
        {
          "label": "Protein",
          "joiner": "and",
          "items": [
            {
              "name": "eggs",
              "contains": [
                "egg"
              ],
              "diet": "egg"
            },
            {
              "name": "paneer",
              "contains": [
                "dairy"
              ]
            },
            {
              "name": "tofu",
              "contains": [
                "soy"
              ]
            },
            {
              "name": "dal"
            },
            {
              "name": "chickpeas"
            }
          ]
        },
        {
          "label": "Colourful vegetables",
          "joiner": "and",
          "items": [
            {
              "name": "carrots"
            },
            {
              "name": "capsicum"
            },
            {
              "name": "tomatoes"
            },
            {
              "name": "leafy greens"
            }
          ]
        },
        {
          "label": "Fibre-rich foods",
          "joiner": "and",
          "items": [
            {
              "name": "oats",
              "contains": [
                "gluten"
              ]
            },
            {
              "name": "whole-wheat roti",
              "contains": [
                "gluten"
              ]
            },
            {
              "name": "millets"
            },
            {
              "name": "beans"
            },
            {
              "name": "fruit"
            }
          ]
        },
        {
          "label": "Healthy fats",
          "joiner": "and",
          "items": [
            {
              "name": "walnuts",
              "contains": [
                "treenut"
              ]
            },
            {
              "name": "almonds",
              "contains": [
                "treenut"
              ]
            },
            {
              "name": "chia seeds"
            },
            {
              "name": "flaxseeds"
            }
          ]
        }
      ],
      "meals": [
        {
          "slot": "Breakfast",
          "options": [
            {
              "id": "fol-b-1",
              "text": "Besan chilla with curd",
              "contains": [
                "dairy"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "fol-b-2",
              "text": "Besan chilla with mint chutney",
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "fol-b-3",
              "text": "Vegetable omelette with whole-wheat toast",
              "contains": [
                "egg",
                "gluten"
              ],
              "diet": "egg",
              "source": "added"
            }
          ]
        },
        {
          "slot": "Lunch",
          "options": [
            {
              "id": "fol-l-1",
              "text": "Roti, dal and mixed vegetables",
              "contains": [
                "gluten"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "fol-l-2",
              "text": "Jowar or bajra roti, dal and mixed vegetables",
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "fol-l-3",
              "text": "Grilled chicken with rice and mixed vegetables",
              "diet": "nonveg",
              "source": "added"
            }
          ]
        },
        {
          "slot": "Snack",
          "options": [
            {
              "id": "fol-s-1",
              "text": "Fruit with nuts or seeds",
              "contains": [
                "treenut",
                "peanut",
                "sesame"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "fol-s-2",
              "text": "Fruit with roasted chana",
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "fol-s-3",
              "text": "A boiled egg with a piece of fruit",
              "contains": [
                "egg"
              ],
              "diet": "egg",
              "source": "added"
            }
          ]
        },
        {
          "slot": "Dinner",
          "options": [
            {
              "id": "fol-d-1",
              "text": "Vegetable khichdi with curd",
              "contains": [
                "dairy"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "fol-d-2",
              "text": "Vegetable khichdi with a side of salad",
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "fol-d-3",
              "text": "Fish curry with rice and vegetables",
              "contains": [
                "fish"
              ],
              "diet": "nonveg",
              "source": "added"
            }
          ]
        }
      ],
      "reminder": "Keep it simple. A balanced meal, enough water and a routine that works for you matter more than following a perfect diet."
    },
    "ovulation": {
      "name": "Ovulation Phase",
      "label": "Ovulation — Keep it varied",
      "when": "Around the middle of your cycle",
      "timing": "Often near day 14 in a 28-day cycle, but timing varies",
      "emoji": [
        "🥙",
        "🍎",
        "🥜"
      ],
      "imageAlt": "Chole with roti and a fresh salad, with a bowl of yoghurt and fruit",
      "intro": "Your body is moving through another stage of your cycle. There's no special food you must eat during ovulation—focus on getting enough nutrients and eating a variety of foods.",
      "foods": [
        {
          "label": "Protein",
          "joiner": "or",
          "items": [
            {
              "name": "paneer",
              "contains": [
                "dairy"
              ]
            },
            {
              "name": "eggs",
              "contains": [
                "egg"
              ],
              "diet": "egg"
            },
            {
              "name": "tofu",
              "contains": [
                "soy"
              ]
            },
            {
              "name": "fish",
              "contains": [
                "fish"
              ],
              "diet": "nonveg"
            },
            {
              "name": "dal"
            }
          ]
        },
        {
          "label": "Fruits and vegetables",
          "joiner": "and",
          "items": [
            {
              "name": "choose a variety of colours"
            }
          ]
        },
        {
          "label": "Fibre",
          "joiner": "and",
          "items": [
            {
              "name": "oats",
              "contains": [
                "gluten"
              ]
            },
            {
              "name": "whole grains",
              "contains": [
                "gluten"
              ]
            },
            {
              "name": "beans"
            },
            {
              "name": "vegetables"
            }
          ]
        },
        {
          "label": "Healthy fats",
          "joiner": "and",
          "items": [
            {
              "name": "nuts",
              "contains": [
                "treenut",
                "peanut"
              ]
            },
            {
              "name": "seeds",
              "contains": [
                "sesame"
              ]
            },
            {
              "name": "fish, if you eat it",
              "contains": [
                "fish"
              ],
              "diet": "nonveg"
            }
          ]
        }
      ],
      "meals": [
        {
          "slot": "Breakfast",
          "options": [
            {
              "id": "ovu-b-1",
              "text": "Vegetable omelette or paneer bhurji with roti",
              "contains": [
                "egg",
                "dairy",
                "gluten"
              ],
              "diet": "egg",
              "source": "brief"
            },
            {
              "id": "ovu-b-2",
              "text": "Paneer bhurji with roti",
              "contains": [
                "dairy",
                "gluten"
              ],
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "ovu-b-3",
              "text": "Moong dal chilla with mint chutney",
              "diet": "veg",
              "source": "added"
            }
          ]
        },
        {
          "slot": "Lunch",
          "options": [
            {
              "id": "ovu-l-1",
              "text": "Chole with roti and salad",
              "contains": [
                "gluten"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "ovu-l-2",
              "text": "Chole with rice and salad",
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "ovu-l-3",
              "text": "Chicken curry with roti and salad",
              "contains": [
                "gluten"
              ],
              "diet": "nonveg",
              "source": "added"
            }
          ]
        },
        {
          "slot": "Snack",
          "options": [
            {
              "id": "ovu-s-1",
              "text": "Yoghurt with fruit",
              "contains": [
                "dairy"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "ovu-s-2",
              "text": "Fresh fruit with roasted chana",
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "ovu-s-3",
              "text": "A boiled egg with fresh fruit",
              "contains": [
                "egg"
              ],
              "diet": "egg",
              "source": "added"
            }
          ]
        },
        {
          "slot": "Dinner",
          "options": [
            {
              "id": "ovu-d-1",
              "text": "Vegetable pulao with raita and a protein source",
              "contains": [
                "dairy"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "ovu-d-2",
              "text": "Vegetable pulao with dal and salad",
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "ovu-d-3",
              "text": "Fish curry with vegetable pulao",
              "contains": [
                "fish"
              ],
              "diet": "nonveg",
              "source": "added"
            }
          ]
        }
      ],
      "reminder": "You don't need to eat differently just because you're ovulating. Listen to your appetite, keep meals balanced, and choose foods you enjoy."
    },
    "luteal": {
      "name": "Luteal Phase",
      "label": "Luteal — Stay nourished",
      "when": "The days before your next period",
      "timing": "Often the final 1–2 weeks, depending on cycle length",
      "emoji": [
        "🥣",
        "🍌",
        "🍫"
      ],
      "imageAlt": "A bowl of oats with banana and seeds, with roasted makhana on the side",
      "intro": "Feeling hungrier than usual, craving chocolate, or experiencing bloating or mood changes before your period? You're not alone. Let's focus on satisfying meals and snacks that keep you nourished.",
      "foods": [
        {
          "label": "Whole grains",
          "joiner": "and",
          "items": [
            {
              "name": "oats",
              "contains": [
                "gluten"
              ]
            },
            {
              "name": "whole-wheat roti",
              "contains": [
                "gluten"
              ]
            },
            {
              "name": "brown rice"
            },
            {
              "name": "millets"
            }
          ]
        },
        {
          "label": "Calcium-rich foods",
          "joiner": "and",
          "items": [
            {
              "name": "milk",
              "contains": [
                "dairy"
              ]
            },
            {
              "name": "curd",
              "contains": [
                "dairy"
              ]
            },
            {
              "name": "yoghurt",
              "contains": [
                "dairy"
              ]
            },
            {
              "name": "paneer",
              "contains": [
                "dairy"
              ]
            },
            {
              "name": "suitable fortified alternatives"
            }
          ]
        },
        {
          "label": "Magnesium-containing foods",
          "joiner": "and",
          "items": [
            {
              "name": "nuts",
              "contains": [
                "treenut",
                "peanut"
              ]
            },
            {
              "name": "seeds",
              "contains": [
                "sesame"
              ]
            },
            {
              "name": "beans"
            },
            {
              "name": "leafy greens"
            }
          ]
        },
        {
          "label": "Filling snacks",
          "joiner": "or",
          "items": [
            {
              "name": "fruit with peanut butter",
              "contains": [
                "peanut"
              ]
            },
            {
              "name": "roasted chana"
            },
            {
              "name": "yoghurt",
              "contains": [
                "dairy"
              ]
            }
          ]
        }
      ],
      "meals": [
        {
          "slot": "Breakfast",
          "options": [
            {
              "id": "lut-b-1",
              "text": "Oats with banana, nuts and seeds",
              "contains": [
                "gluten",
                "treenut",
                "peanut",
                "sesame"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "lut-b-2",
              "text": "Vegetable poha with a banana on the side",
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "lut-b-3",
              "text": "Boiled eggs with whole-wheat toast and a banana",
              "contains": [
                "egg",
                "gluten"
              ],
              "diet": "egg",
              "source": "added"
            }
          ]
        },
        {
          "slot": "Lunch",
          "options": [
            {
              "id": "lut-l-1",
              "text": "Roti, dal, sabzi and curd",
              "contains": [
                "gluten",
                "dairy"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "lut-l-2",
              "text": "Rice, dal and sabzi",
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "lut-l-3",
              "text": "Chicken curry with rice and sabzi",
              "diet": "nonveg",
              "source": "added"
            }
          ]
        },
        {
          "slot": "Snack",
          "options": [
            {
              "id": "lut-s-1",
              "text": "Roasted makhana or chana, or a little chocolate if you fancy it",
              "contains": [
                "dairy",
                "soy",
                "treenut",
                "peanut"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "lut-s-2",
              "text": "Roasted makhana or roasted chana",
              "diet": "veg",
              "source": "added"
            }
          ]
        },
        {
          "slot": "Dinner",
          "options": [
            {
              "id": "lut-d-1",
              "text": "Vegetable khichdi with paneer or tofu",
              "contains": [
                "dairy",
                "soy"
              ],
              "diet": "veg",
              "source": "brief"
            },
            {
              "id": "lut-d-2",
              "text": "Vegetable khichdi with dal and salad",
              "diet": "veg",
              "source": "added"
            },
            {
              "id": "lut-d-3",
              "text": "Vegetable khichdi with a boiled egg",
              "contains": [
                "egg"
              ],
              "diet": "egg",
              "source": "added"
            }
          ]
        }
      ],
      "reminder": "Cravings are not a failure of willpower. Eat enough, enjoy your favourite foods without guilt, and see whether regular meals help you feel more comfortable."
    }
  }
}
$guide$::jsonb)
ON CONFLICT (key) DO NOTHING;
