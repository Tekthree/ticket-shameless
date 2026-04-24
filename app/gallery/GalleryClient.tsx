'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const C = {
  dark: '#1c1917',
  darkDeep: '#111110',
  darkCard: '#252220',
  darkBorder: 'rgba(255,255,255,0.07)',
  darkText: '#f0ece6',
  darkMuted: '#7a7068',
  red: '#c9321a',
  redDeep: '#a82614',
  redMuted: 'rgba(201,50,26,0.12)',
}

type Photo = {
  id: string
  src: string | null
  alt: string
  aspect: number
}

type GalleryEvent = {
  id: string
  title: string
  date: string
  venue: string
  photographer: { name: string; url: string }
  photos: Photo[]
}

const ASPECTS = [1, 1.25, 0.8, 1.1, 0.9, 1.2, 1, 0.85, 1.15, 1, 1.3, 0.8, 1, 1.1, 0.9, 1, 1.2, 0.85, 1.1, 1]

const ANNIV_URLS = [
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_couple_dancing_braids_glasses.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_couple_hugging_lace_top.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_couple_hugging_plaid_dress_bw.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_couple_hugging_red_lipstick.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_couple_plaid_shirt_beanie_newsboy_cap.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_couple_smiling_colorful_hair.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_couple_smiling_plaid_shirt_newsboy_cap_glasses.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_crowd_dancing_disco_balls_hands_up.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_crowd_dancing_hands_up.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_crowd_dancing_hands_up_dj_booth.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_crowd_dancing_hands_up_energetic.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_crowd_dancing_hands_up_smiling_woman.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_crowd_dancing_yes_logo_sequin_backdrop.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_crowd_hands_up_sequin_wall_dancing.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_disco_ball_geometric_decor_colorful_lights.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_booth_overhead_crowd_pioneer_equipment.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_booth_overhead_pioneer_equipment_yes_sign.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_booth_pioneer_cdj_orange_lighting.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_booth_yes_sign_crowd_sequin_wall.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_camo_captain_hat_thumbs_up_disco_ball.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_camo_outfit_captain_hat_smiling.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_cap_leopard_print_smiling_geometric_lights.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_captain_hat_camo_geometric_fan_disco_ball.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_captain_hat_camo_headphones_pointing.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_headphones_sequin_backdrop.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_leopard_print_headphones_cap.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_leopard_print_headphones_geometric_lights.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_leopard_print_performing_geometric_lights.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_leopard_print_visor_chains_smiling.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_mixing_sequin_wall.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_performing_crowd_sequin_backdrop.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_performing_crowd_yes_logo.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_performing_tattoos_sequin_backdrop_crowd.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_performing_yes_logo_sequin_wall.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_performing_yes_sign_sequin_wall.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_dj_smiling_leopard_print_geometric_decor.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_djs_booth_mirror_ball_red_lighting.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_group_four_friends_bar.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_group_four_friends_bar_area.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_hands_holding_rose_peace_sign.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_man_fedora_shameless_shirt_yes_sign.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_man_smiling_crowd_red_lighting.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_man_smiling_goatee_crowd.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_man_smiling_yellow_backpack_stuffed_animal.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_overhead_crowd_dj_booth_view.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_people_dancing_hands_up.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_people_dancing_purple_striped_shirt.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_performer_microphone_sequin_wall_crowd.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_performer_tattoos_microphone_vest.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_person_chainmail_hood_leopard_print_bar.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_person_chainmail_hood_leopard_print_tattoos.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_person_cowboy_hat_white_sunglasses.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_person_dancing_pink_glasses_patterned_jacket.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_three_women_balcony_drinks.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_three_women_dancing_smiling_red_lighting_leopard_print.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_three_women_posing_blonde_tattoos_tongue.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_three_women_selfie_blonde_tattoos.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_three_women_selfie_tattoos_drinks.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_trio_friends_red_jacket_patterned_shirts.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_trio_green_jacket_colorful_hair.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_trio_laughing_blue_cap_purple_striped_shirt.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_trio_smiling_colorful_shirt_blonde.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_trio_smiling_orange_feather_boa.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_djs_blue_beanie_fender_shirt_pioneer_equipment.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_djs_laughing_leopard_print_purple_hair.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_men_hats_ett_hoodie_drinks_bar.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_men_laughing_red_patterned_hoodie.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_men_peace_signs_caps.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_men_shameless_shirts_colorful_cap.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_men_sunglasses_colorful_hat.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_people_hugging_intimate_moment.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_people_orange_sunglasses_mustaches_peace_sign.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_people_pink_hair_green_dress_club_kids.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_women_dancing_purple_fur_jacket.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_women_glasses_23_years_shirt.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_women_hugging_purple_hair_jellyfish_tattoo.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_women_smiling_black_outfits.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_women_smiling_plaid_skirt.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_two_women_smiling_plaid_skirt_black_outfits.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_woman_blonde_hair_dancing.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_woman_blonde_hair_dancing_red_lighting.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_woman_dancing_balcony_view.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_woman_dancing_glasses_braids.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_woman_dancing_mesh_top_red_skirt_dj_booth.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_woman_mushroom_sweater_glasses_drink_dancing.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_woman_pink_glasses_chains_smiling.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_woman_pink_hair_green_dress_club_kids_sign.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_woman_pink_hair_headphones_jacket.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_woman_salute_23_years_shirt_glasses.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_woman_smiling_drink_brick_wall.jpg",
]

const PICFLOW_URLS = [
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_001_two-people-posing-red-lighting.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_002_crowd-party-woman-sunglasses-drink.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_003_man-floral-outfit-backbend-pose.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_004_dj-turntables-crowd-hands-up.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_005_two-men-beards-wigs-festive-outfits.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_006_man-green-cowboy-hat-purple-jacket.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_007_group-four-people-bar-smiling.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_008_dj-shirtless-blue-shirt-crowd.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_009_two-people-glasses-wooden-wall.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_010_woman-blonde-yellow-mascot-costume.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_011_man-mustache-gray-hat-woman-yellow-fur.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_012_party-microphone-trumpet-player-costumes.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_013_group-six-people-shirtless-man-fringe-hat.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_014_group-four-colorful-wigs-sunglasses.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_015_man-orange-beanie-sunglasses-tattoo.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_016_person-checkered-cap-mouth-sunglasses-pink-hair.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_017_large-group-rooftop-seattle-skyline.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_018_man-mohawk-sunglasses-leather-jacket.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_019_dj-booth-crowd-blazers-jersey.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_020_man-burgundy-jacket-fedora-woman-blonde.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_021_crowd-hands-up-neon-lighting-skyline.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_022_man-burgundy-jacket-peace-sign-woman.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_023_two-men-gold-mask-orange-beanie-fur.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_024_five-women-street-art-mural-colorful.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_025_woman-pink-fur-coat-plush-toy.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_026_woman-pink-fur-coat-plush-toy-duplicate.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_027_woman-embroidered-headband-green-sequined-top.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_028_dj-crowd-orange-inflatable-figure.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_029_man-crocheted-cardigan-behind-bar.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_030_woman-glasses-curly-hair-harness-accessory.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_031_three-people-rainbow-outfit-sequined-jacket.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_032_group-seven-people-various-costumes.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_033_man-vibes-cap-woman-face-jewels.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_034_person-orange-horse-head-zebra-outfit.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_035_large-group-street-colorful-outfits.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_036_man-hat-yellow-plaid-holding-doll.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_037_man-dreadlocks-white-fuzzy-hat-tan-jacket.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_038_couple-colorful-striped-blazer-fur-coat.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_039_two-djs-disco-shirt-pink-jacket.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_040_man-yellow-plaid-elaborate-costume-piece.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_041_yellow-mascot-arms-raised-rooftop.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_042_crowd-celebrating-orange-inflatable-raised.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_043_crowded-rooftop-pink-furry-costume.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_044_three-people-beaded-fringe-hat-excited.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_045_two-people-yellow-inflatable-hands-donut-glasses.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_046_group-seven-people-various-festive-outfits.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_047_three-men-beards-colorful-knit-hats.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_048_two-people-furry-costume-clown-marionette.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_049_woman-cat-ear-beanie-inflatable-banana.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_050_large-group-rooftop-colorful-festive-outfits.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_051_marching-band-brass-instruments-black-outfits.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_052_two-people-teal-cap-chain-headpiece.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_053_two-djs-mohawk-leopard-print-pointing.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_brass_band_performance_indoor.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_couple_green_cap_purple_hair_crowd.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_dj_duo_yellow_plaid_crowd_rooftop.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_dj_duo_yellow_plaid_peace_signs_rooftop.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_dj_duo_yellow_plaid_peace_signs_rooftop_duplicate.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_dj_duo_yellow_plaid_rooftop.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_group_yellow_coat_rooftop.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_large_group_rooftop_colorful_outfits_skyline.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_man_dinosaur_shirt_arms_raised_celebrating.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_phone_recording_rooftop_party_crowd.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_three_friends_rainbow_outfit_street.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_trio_mustache_red_sunglasses_pink_brick.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_trio_rooftop_disco_ball_decorations.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_trio_shameless_shirt_excited_balloons.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_two_men_beards_colorful_geometric_jacket.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_woman_black_sequin_outfit_crown_hands_up.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_woman_gold_dress_heart_hands_headpiece_crowd.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_woman_green_sequin_vest_embellished_cap_dancing.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_woman_neon_green_wig_zebra_coat_rooftop.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_woman_red_dress_colorful_cap_sunglasses_bar.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_woman_yellow_fuzzy_coat_silly_face_bar.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Picflow%20Images%20Dec%2010/the_breakfast_club_shameless_pnw_monkey_loft_seattle_woman_zebra_jacket_orange_pants_dancing.jpg",
]

const TBC2024_URLS = [
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493140488_1344532903737774_5220263180204164903_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493157063_1344533050404426_8135409775230592086_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493170536_1344532840404447_4341008408130569276_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493194687_1344532943737770_5368142751446365719_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493194687_1344533223737742_475815787737717188_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493195234_1344532893737775_5642302240478056619_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493195234_1344533013737763_430901912930933437_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493203101_1344532983737766_5629159882785258962_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493216160_1344532887071109_7396622984446229422_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493216160_1344532917071106_1094732576728713674_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493225485_1344533053737759_877335258576819254_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493225600_1344533213737743_1202974745556460155_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493225612_1344531740404557_3211746566384591108_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493225616_1344532970404434_2278849544144750105_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493226228_1344533017071096_8728651565101501881_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493226246_1344532787071119_3312484629651750044_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493226920_1344533187071079_7738638864037233085_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493228135_1344532927071105_4865450664264426153_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493228170_1344533043737760_4078217690665813968_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493228568_1344533020404429_4210590041746281849_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493228712_1344532007071197_2643474351127564554_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493228904_1344533123737752_620013199968557152_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493228925_1344533040404427_2639516597266590893_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493229543_1344532857071112_2090235176144889259_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493230212_1344531940404537_5388000606747549608_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493231746_1344533160404415_8559682266008610055_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493253717_1344533230404408_2400026627145937293_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493254595_1344533007071097_7313739483123838613_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493254606_1344533047071093_8949494508169295501_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493254609_1344532990404432_4258011831641181739_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493254943_1344533033737761_7262743372351153351_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493255629_1344531720404559_7986367736172240910_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493255662_1344532987071099_5257608602490522557_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493257458_1344533010404430_2564114828920622576_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493258218_1344532783737786_7532345501740808445_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493258850_1344532993737765_4711534514184360725_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493260250_1344532073737857_1735912890715623771_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493260250_1344532090404522_8052694396236603515_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493260784_1344533227071075_4088155550875358394_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493260829_1344532833737781_7066838279251414663_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493261299_1344533063737758_3671181955090752455_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493261688_1344531893737875_7288029114831448513_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493262118_1344533207071077_3514081273301074020_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493263169_1344532863737778_510411014090560500_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493263603_1344532873737777_2796001134742325903_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493263609_1344531843737880_8211153286428682246_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493264013_1344533003737764_8515911147322944715_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493264151_1344532830404448_5049756080002071692_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493264198_1344533097071088_9006263933750136064_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493264202_1344533273737737_3576592351109308668_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493264867_1344533093737755_8175298462932729630_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493265188_1344532950404436_1243761399429942502_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493265759_1344533277071070_788816463195534359_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493266175_1344532877071110_4712969335274915433_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493272356_1344533100404421_4474564267057670891_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493272669_1344532920404439_4924437158565552299_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493272969_1344531963737868_7234962435110253589_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493273350_1344532973737767_2559886788825133359_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493273714_1344531803737884_6093676511798684910_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493274014_1344532900404441_7450413071382899684_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493275152_1344531957071202_8473693657798179003_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493275273_1344533163737748_667958268333564113_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493275571_1344533203737744_2927550672689332263_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493275857_1344533140404417_8324982321272809851_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493275960_1344532980404433_3983814446300660195_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493276198_1344533150404416_7773559205786427297_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493276220_1344533060404425_4914456548660406937_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493277329_1344532937071104_2171387494791156272_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493277933_1344532940404437_4754496870290206554_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493278399_1344533220404409_3605289182384454655_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493522783_1344532977071100_7910360827308782982_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493538161_1344532817071116_6831772844693527313_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493550030_1344532957071102_3045880958661114761_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493564790_1344531777071220_5940708388536223353_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493566780_1344533177071080_7699788119763193347_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493605783_1344531773737887_240410858329063543_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493641029_1344532813737783_3431497240822143100_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493696984_1344532780404453_9040842284600295300_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493732062_1344532947071103_1009565581868760716_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493752508_1344532797071118_8497937577331848536_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493760584_1344532843737780_5881718504977114699_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493786657_1344533197071078_3490966742537327549_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493887815_1344532167071181_8710242380588721554_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493903515_1344533073737757_3088892354502824814_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493904412_1344532867071111_1997050387930719265_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/493997267_1344533157071082_9039932328909002280_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/494004996_1344533143737750_4179150260279465218_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/494013427_1344533030404428_3839895940073549173_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/494073985_1344532127071185_7875843757337780898_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/494142223_1344533137071084_2365757163776127559_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/494155871_1344532807071117_1582584217064725036_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/494264410_1344532163737848_102014922088989045_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492454485_1344533077071090_8151875062240660862_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492524516_1344531753737889_3247140735333414825_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492528490_1344533253737739_7397160527287523435_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492529633_1344532910404440_608220974941801136_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492543277_1344531813737883_3229437348842415362_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492547041_1344533240404407_1998164306169145993_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492549583_1344532800404451_6167408538235995306_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492549708_1344532033737861_395874973614012695_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492550784_1344531883737876_94971714703248533_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492552777_1344533080404423_6234857670407715837_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492553626_1344533113737753_7940411309715338286_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492568670_1344532880404443_7811709336703110824_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492595567_1344532827071115_4649634927476315766_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492603356_1344533107071087_4009537237980130200_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492649563_1344533263737738_8115240411797392684_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492657486_1344531767071221_1924855643941963430_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492659170_1344531857071212_9173227875607698884_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492681480_1344532967071101_3999998721369213118_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492688239_1344533110404420_8476471286252359087_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492699512_1344533087071089_4038033768533039819_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492728843_1344532897071108_2510571130569556398_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492741685_1344533247071073_3697539519345644599_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492747047_1344533117071086_5353953038401629733_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492747047_1344533170404414_143419862423809403_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492752582_1344531673737897_1489717070775731889_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492752586_1344532960404435_750858259075836785_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492802140_1344532820404449_1572145093853464823_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492802433_1344531783737886_7200782722784287257_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492804810_1344533070404424_3201674796185132687_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492819324_1344531810404550_4684773290157600054_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492829874_1344532847071113_5788863387679552525_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492833762_1344533127071085_2670963331215746675_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492833868_1344531930404538_8487753771549663071_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492835280_1344533147071083_3671682883201682921_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492839721_1344531967071201_8324976435324143986_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492840456_1344533217071076_6903793336805308825_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492845868_1344533133737751_3718742284686619383_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492857403_1344533037071094_4516099769529361471_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492861724_1344531763737888_7750874324744997281_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492885835_1344531790404552_1700674581993275693_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492888487_1344532790404452_6327041777175840840_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492889701_1344532803737784_8919642387158657880_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492897659_1344532793737785_4791420910290838078_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492898787_1344533103737754_8599385276687880593_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492904876_1344533120404419_4188122668981398807_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492923117_1344532870404444_5572379229928654394_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492925681_1344532860404445_3993730035230232533_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492925690_1344531733737891_2553131325544430920_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492930007_1344531797071218_1951882088071287755_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492936146_1344532103737854_3248973171619852796_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492956018_1344532923737772_1097698227295768267_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492966213_1344533090404422_5088197525392894551_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492967403_1344533027071095_799956499155978806_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/492993587_1344533267071071_7349166307241535668_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493005524_1344532953737769_6820201480651172816_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493007920_1344533243737740_7692542152013328864_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493009380_1344531680404563_1211986914692122536_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493026090_1344532810404450_945948603237749667_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493028091_1344531820404549_8014438835230387410_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493034059_1344533023737762_7266299315288658003_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493035388_1344531910404540_6846517502553354594_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493053206_1344533190404412_7076430042350506589_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493054367_1344533000404431_5419400529090115002_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493062529_1344531787071219_7144113780566504735_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493075248_1344533250404406_4601254385112015602_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493081153_1344531987071199_2871519521778871564_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493081153_1344532930404438_4883567252564402768_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493101405_1344531913737873_7345605155637926491_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493130015_1344533153737749_7039086510042493553_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493134635_1344532997071098_6293572278627013008_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493136146_1344532963737768_1672016320579620873_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493136154_1344531670404564_2114831228548259567_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493136252_1344531750404556_7353544326403230521_n.jpg",
  "https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/The%20Breakfast%20Club%202024%20Part%201%20images/The%20Breakfast%20Club%202024%20Part%202%20images/493138173_1344533067071091_2209294644832246773_n.jpg",
]

const EVENTS: GalleryEvent[] = [
  {
    id: 'club-yes-anniversary',
    title: 'Club Yes x Shameless',
    date: '23rd Anniversary',
    venue: 'Monkey Loft, Seattle',
    photographer: { name: 'Manny Dan', url: 'https://www.instagram.com/manny_dan_media/' },
    photos: ANNIV_URLS.map((src, i) => ({ id: `anniv-${i}`, src, alt: `Club Yes & Shameless 23rd Anniversary — photo ${i + 1}`, aspect: ASPECTS[i % ASPECTS.length] })),
  },
  {
    id: 'breakfast-club-dec',
    title: 'The Breakfast Club',
    date: '2025',
    venue: 'Monkey Loft, Seattle',
    photographer: { name: 'Manny Dan', url: 'https://www.instagram.com/manny_dan_media/' },
    photos: PICFLOW_URLS.map((src, i) => ({ id: `picflow-${i}`, src, alt: `The Breakfast Club — photo ${i + 1}`, aspect: ASPECTS[i % ASPECTS.length] })),
  },
  {
    id: 'breakfast-club-2024',
    title: 'The Breakfast Club',
    date: '2024',
    venue: 'Monkey Loft, Seattle',
    photographer: { name: 'Manny Dan', url: 'https://www.instagram.com/manny_dan_media/' },
    photos: TBC2024_URLS.map((src, i) => ({ id: `tbc24-${i}`, src, alt: `The Breakfast Club 2024 — photo ${i + 1}`, aspect: ASPECTS[i % ASPECTS.length] })),
  },
]

function PhotoPlaceholder({ index, eventId }: { index: number; eventId: string }) {
  const hues: Record<string, number> = { 'reverie-apr-26': 220, 'reverie-may-3': 250, 'memorial-day': 30 }
  const hue = hues[eventId] ?? 220
  const lightness = 9 + (index % 5) * 2
  const angles = [30, 45, 60, 20, 15, 50]
  const angle = angles[index % angles.length]
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: `hsl(${hue},18%,${lightness}%)` }}>
      <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(${angle}deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent ${14 + index * 3}px)` }} />
    </div>
  )
}

function PhotoGrid({ photos, event, onOpen }: { photos: Photo[]; event: GalleryEvent; onOpen: (i: number) => void }) {
  const cols = 3
  const columns: { photo: Photo; index: number }[][] = Array.from({ length: cols }, () => [])
  photos.forEach((photo, i) => columns[i % cols].push({ photo, index: i }))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 3 }} className="ss-gallery-grid">
      {columns.map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {col.map(({ photo, index }) => (
            <div
              key={photo.id}
              onClick={() => onOpen(index)}
              style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', background: C.darkCard, aspectRatio: photo.aspect || 1 }}
              className="ss-photo-cell"
            >
              {photo.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.src} alt={photo.alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <PhotoPlaceholder index={index} eventId={event.id} />
              )}
              <div className="ss-photo-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(28,25,23,0)', transition: 'background 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 12 }}>
                <div className="ss-photo-credit" style={{ opacity: 0, transform: 'translateY(4px)', transition: 'opacity 0.2s, transform 0.2s' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {event.photographer.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function ReportModal({ photo, event, onClose }: { photo: Photo; event: GalleryEvent; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('face')
  const [details, setDetails] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.dark, border: `1px solid ${C.darkBorder}`, padding: 'clamp(28px,5vw,36px) clamp(20px,5vw,40px)', width: '100%', maxWidth: 480 }}>
        {step === 1 ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.red, marginBottom: 8 }}>Image Removal Request</div>
                <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 22, color: C.darkText, textTransform: 'uppercase', lineHeight: 1 }}>Report This Photo</div>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.darkMuted, cursor: 'pointer', fontSize: 22, marginLeft: 16, flexShrink: 0 }}>×</button>
            </div>
            <p style={{ color: C.darkMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              We take privacy seriously. If you appear in this photo and would like it removed, fill out the form below and we&apos;ll respond within 48 hours.
            </p>
            <form onSubmit={e => { e.preventDefault(); setStep(2) }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.darkMuted, display: 'block', marginBottom: 6 }}>Your Name *</label>
                <input required className="report-input" placeholder="First Last" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.darkMuted, display: 'block', marginBottom: 6 }}>Email *</label>
                <input required type="email" className="report-input" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.darkMuted, display: 'block', marginBottom: 6 }}>Reason *</label>
                <select className="report-input" value={reason} onChange={e => setReason(e.target.value)} style={{ cursor: 'pointer' }}>
                  <option value="face">My face appears in this photo</option>
                  <option value="consent">I did not consent to being photographed</option>
                  <option value="minor">This photo contains a minor</option>
                  <option value="other">Other privacy concern</option>
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.darkMuted, display: 'block', marginBottom: 6 }}>Additional details</label>
                <textarea className="report-input" rows={3} placeholder="Describe where you appear in the photo or any other relevant details..." value={details} onChange={e => setDetails(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, background: C.red, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase', padding: 15 }}>Submit Request</button>
                <button type="button" onClick={onClose} style={{ padding: '15px 20px', background: 'transparent', border: `1px solid ${C.darkBorder}`, color: C.darkMuted, cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Cancel</button>
              </div>
            </form>
            <p style={{ color: 'rgba(122,112,104,0.5)', fontSize: 11, lineHeight: 1.6, marginTop: 16 }}>
              Photo: {event.title} · {event.date} · Photographer: {event.photographer.name}<br />
              We will never share your personal information. Requests are reviewed within 48 hours.
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, background: C.redMuted, border: `2px solid ${C.red}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24, color: C.red }}>✓</div>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 28, color: C.darkText, textTransform: 'uppercase', marginBottom: 12 }}>Request Received</div>
            <p style={{ color: C.darkMuted, fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              Thanks {name.split(' ')[0]}. We&apos;ve logged your request and will review it within 48 hours. You&apos;ll hear from us at <strong style={{ color: C.darkText }}>{email}</strong>.
            </p>
            <button onClick={onClose} style={{ background: C.red, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '14px 36px' }}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}

function PhotoModal({
  photo, photoIndex, allPhotos, event, onClose, onNav,
}: {
  photo: Photo; photoIndex: number; allPhotos: Photo[]; event: GalleryEvent; onClose: () => void; onNav: (d: number) => void
}) {
  const [reporting, setReporting] = useState(false)
  const hasPrev = photoIndex > 0
  const hasNext = photoIndex < allPhotos.length - 1

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onNav(-1)
      if (e.key === 'ArrowRight') onNav(1)
    }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose, onNav])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(8,7,6,0.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'ss-fadeIn 0.2s ease' }} onClick={onClose}>
      <div style={{ position: 'relative', maxWidth: 1000, width: '100%', animation: 'ss-scaleIn 0.3s cubic-bezier(0.22,1,0.36,1)' }} onClick={e => e.stopPropagation()}>
        {/* Image */}
        <div style={{ position: 'relative', background: C.darkCard, maxHeight: '72vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {photo.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.src} alt={photo.alt} style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', aspectRatio: photo.aspect || 1, maxHeight: '72vh', position: 'relative' }}>
              <PhotoPlaceholder index={photoIndex} eventId={event.id} />
            </div>
          )}
        </div>

        {/* Info bar */}
        <div style={{ background: C.dark, border: `1px solid ${C.darkBorder}`, borderTop: 'none', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke={C.red} strokeWidth="1.3"/><circle cx="8" cy="8" r="2.5" stroke={C.red} strokeWidth="1.3"/><path d="M5.5 5.5L4 4M10.5 5.5L12 4M10.5 10.5L12 12M5.5 10.5L4 12" stroke={C.red} strokeWidth="1.1" strokeLinecap="round"/></svg>
              <div>
                <span style={{ color: C.darkMuted, fontSize: 11, fontFamily: 'var(--font-barlow), sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>Photo by </span>
                <a href={event.photographer.url} target="_blank" rel="noopener noreferrer" style={{ color: C.darkText, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', textDecoration: 'none', borderBottom: `1px solid ${C.darkBorder}`, paddingBottom: 1 }}>
                  {event.photographer.name} ↗
                </a>
              </div>
            </div>
            <span style={{ color: C.darkMuted, fontSize: 12, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {event.title} · {event.date}
            </span>
            <span style={{ color: 'rgba(122,112,104,0.5)', fontSize: 12 }}>{photoIndex + 1} / {allPhotos.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setReporting(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${C.darkBorder}`, color: C.darkMuted, cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 14px' }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1v6M7 10v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/></svg>
              Report Image
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${C.darkBorder}`, color: C.darkMuted, cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 14px' }}>
              Close ×
            </button>
          </div>
        </div>
      </div>

      {reporting && <ReportModal photo={photo} event={event} onClose={() => setReporting(false)} />}

      {/* Nav arrows */}
      {hasPrev && (
        <button onClick={e => { e.stopPropagation(); onNav(-1) }} style={{ position: 'fixed', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(28,25,23,0.8)', border: `1px solid ${C.darkBorder}`, color: C.darkText, cursor: 'pointer', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 510 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      {hasNext && (
        <button onClick={e => { e.stopPropagation(); onNav(1) }} style={{ position: 'fixed', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(28,25,23,0.8)', border: `1px solid ${C.darkBorder}`, color: C.darkText, cursor: 'pointer', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 510 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
    </div>
  )
}

export default function GalleryClient() {
  const [activeEvent, setActiveEvent] = useState(EVENTS[0].id)
  const [modal, setModal] = useState<{ photoIndex: number } | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)

  const event = EVENTS.find(e => e.id === activeEvent) ?? EVENTS[0]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const tabs = tabsRef.current
    if (!tabs) return
    const active = tabs.querySelector<HTMLElement>('.ss-tab-active')
    if (active) active.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }, [activeEvent])

  const openModal = (index: number) => setModal({ photoIndex: index })
  const closeModal = useCallback(() => setModal(null), [])
  const navModal = useCallback((dir: number) => {
    setModal(m => {
      if (!m) return null
      const next = m.photoIndex + dir
      if (next < 0 || next >= event.photos.length) return m
      return { photoIndex: next }
    })
  }, [event.photos.length])

  return (
    <div style={{ minHeight: '100vh', background: C.dark }}>
      {/* Page header */}
      <div style={{ paddingTop: 64, background: C.dark }}>
        <div style={{ padding: 'clamp(40px, 6vw, 60px) clamp(20px, 4vw, 56px) 0', maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.red, marginBottom: 12 }}>From the Floor</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(52px, 8vw, 100px)', lineHeight: 0.86, textTransform: 'uppercase', color: C.darkText, margin: 0 }}>
              Gallery
            </h1>
            <p style={{ color: C.darkMuted, fontSize: 15, lineHeight: 1.7, maxWidth: 340, fontWeight: 300, margin: 0 }}>
              All photography is credited to the original artist. Photos are taken at our public events.
            </p>
          </div>
        </div>

        {/* Event tabs */}
        <div style={{ position: 'sticky', top: 64, zIndex: 100, background: 'rgba(28,25,23,0.97)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.darkBorder}`, marginTop: 32 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: `0 clamp(20px, 4vw, 56px)`, display: 'flex', alignItems: 'stretch' }}>
            <div ref={tabsRef} style={{ flex: 1, display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {EVENTS.map(e => (
                <button
                  key={e.id}
                  className={activeEvent === e.id ? 'ss-tab-active' : ''}
                  onClick={() => { setActiveEvent(e.id); window.scrollTo({ top: 200, behavior: 'smooth' }) }}
                  style={{
                    flexShrink: 0,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-barlow), sans-serif',
                    fontWeight: 800,
                    fontSize: 15,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: activeEvent === e.id ? C.darkText : 'rgba(240,236,230,0.4)',
                    padding: '16px 24px',
                    position: 'relative',
                    transition: 'color 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {e.title}
                  <span style={{ color: activeEvent === e.id ? 'rgba(240,236,230,0.4)' : 'rgba(240,236,230,0.2)', fontWeight: 600, marginLeft: 6, fontSize: 13 }}>
                    {e.date.split(',')[0]}
                  </span>
                  <span style={{ position: 'absolute', bottom: 0, left: 0, width: activeEvent === e.id ? '100%' : '0%', height: 2, background: C.red, transition: 'width 0.3s cubic-bezier(0.22,1,0.36,1)' }} />
                </button>
              ))}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: 20, borderLeft: `1px solid ${C.darkBorder}` }}>
              <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.darkMuted, whiteSpace: 'nowrap' }}>
                {event.photos.length} photos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Event info strip */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: `24px clamp(20px, 4vw, 56px)`, borderBottom: `1px solid ${C.darkBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 24, color: C.darkText, textTransform: 'uppercase', lineHeight: 1 }}>{event.title}</div>
          <div style={{ color: C.darkMuted, fontSize: 14, marginTop: 4 }}>{event.date} · {event.venue}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke={C.red} strokeWidth="1.3"/><circle cx="8" cy="8" r="2.5" stroke={C.red} strokeWidth="1.3"/></svg>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.darkMuted }}>
            Photography by{' '}
            <a href={event.photographer.url} target="_blank" rel="noopener noreferrer" style={{ color: C.red, textDecoration: 'none', borderBottom: '1px solid rgba(201,50,26,0.3)', paddingBottom: 1 }}>
              {event.photographer.name} ↗
            </a>
          </div>
        </div>
      </div>

      {/* Photo grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: `20px clamp(20px, 4vw, 56px) 80px` }}>
        <PhotoGrid photos={event.photos} event={event} onOpen={openModal} />

        {/* Privacy notice */}
        <div style={{ marginTop: 48, padding: '20px 24px', background: C.darkCard, border: `1px solid ${C.darkBorder}`, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="10" cy="10" r="8.5" stroke={C.red} strokeWidth="1.4"/><path d="M10 7v4M10 13v.5" stroke={C.red} strokeWidth="1.8" strokeLinecap="round"/></svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.darkText, marginBottom: 6 }}>Privacy & Image Removal</div>
            <div style={{ color: C.darkMuted, fontSize: 14, lineHeight: 1.7 }}>
              All photos are taken at our public events by credited photographers. If you appear in any image and would like it removed, email{' '}
              <a href="mailto:privacy@simplyshameless.com" style={{ color: C.red, textDecoration: 'none' }}>privacy@simplyshameless.com</a>. We process all requests within 48 hours.
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <PhotoModal
          photo={event.photos[modal.photoIndex]}
          photoIndex={modal.photoIndex}
          allPhotos={event.photos}
          event={event}
          onClose={closeModal}
          onNav={navModal}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ss-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ss-scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        .ss-photo-cell:hover .ss-photo-overlay { background: rgba(28,25,23,0.5) !important; }
        .ss-photo-cell:hover .ss-photo-credit { opacity: 1 !important; transform: translateY(0) !important; }
        @media (max-width: 640px) {
          .ss-gallery-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        .report-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #f0ece6; font-family: var(--font-dm), sans-serif; font-size: 15px; padding: 12px 14px; outline: none; transition: border-color 0.2s; resize: none; box-sizing: border-box; }
        .report-input:focus { border-color: #c9321a; }
        .report-input::placeholder { color: #7a7068; }
      ` }} />
    </div>
  )
}
