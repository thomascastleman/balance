// Text formatting tools

// extract the necessary information from an equation in string format
function extract(side, formattedTerms) {
	// for each term on left side
	for (var term = 0; term < side.length; term++) {

		// initialize a map to store symbols and their subscripts
		side[term] = new Map();

		t = formattedTerms[term];
		var secondParen = null;
		var multiplier = 1;


		// for every character in term
		for (var char = 0; char < t.length; char++) {
			var sym = "";
			var sub = "";


			// if paren
			if (t[char] == '(') {
				secondParen = char;

				// look for closing paren
				while (t[secondParen] != ')') {
					secondParen++;
				}

				// find multiplier for all subscripts found within parens
				var multiplier = t[secondParen + 1];

				char++; // increment character past paren

			} else if (t[char] == ')') { 	// if at closing paren
				char++; 					// increment past closed paren

				// increment past all following digits
				while (digits.includes(parseInt(t[char], 10))) {
					char++;
				}

				// if at the end of term, break
				if (char >= t.length) {
					break;
				}
			}

			// if uppercase
			if (t[char] = t[char].toUpperCase()) {
				sym = t[char];		// update symbol

				var next = t[char + 1];		// get next character

				// if next character exists and is lowercase
				if (next != undefined && (next != next.toUpperCase())) {
					sym += next;	// add it to current symbol
					char++;			// increment character past

				} else {
					// if next character is not a number
					if (!digits.includes(parseInt(next, 10))) {
						// set subscript to 1
						sub = 1;
					}
				}
			}

			// if subscript not yet found
			if (sub == "") {
				char++;						// increment character
				while (char < t.length) {
					// if digit
					if (digits.includes(parseInt(t[char], 10))) {
						sub += t[char];		// add string representation to subscript
						char++;				// increment character

					} else {		// if not digit
						char--;		// move back to last digit character, as loop will increment char anyway
						break;
					}
				}
			}

			// if still no digits found, subscript defaults to 1
			sub = sub == "" ? 1 : sub;

			// if within parens, multiply
			if (char < secondParen) {
				sub *= multiplier;
			}

			// add symbol subscript pair to map for this term
			side[term].add(sym, parseInt(sub, 10));
		}
	}
}

// format terms and coefficients into a single string
function formatWithCoeffs(terms, coeffs) {
	for (var side = 0; side < terms.length; side++) {
		for (var t = 0; t < terms[side].length; t++) {
			if (coeffs[side][t] != 1) {
				terms[side][t] = coeffs[side][t] + " " + terms[side][t];
			}
		}
	}

	return terms[0].join(" + ") + " = " + terms[1].join(" + ");
}