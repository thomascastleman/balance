
// var str = "KMnO4 + HCl = KCl + MnCl2 + H2O + Cl2";
// var str = "NaHCO3 = Na2CO3 + CO2 + H2O";
// var str = "HNO3 + Al(OH)3 = Al(NO3)3 + H2O";
// var str = "CO2 + CaCO3 + H2O = Ca(HCO3)2";
// var str = "Pb(C2H5)4 + O2 = CO2 + H2O + PbO";
var str = "NaNO3 + Ba3(PO4)2 = Na3PO4 + Ba(NO3)2";
// var str = "Na2CO3 + H3PO4 = CO2 + Na2PO4 + H2O";

var digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

var e = new Equation(str);
e.balance();

// check if no more undefined values in coefficients
function checkSolved(coefficients) {
	for (var i = 0; i < coefficients[0].length; i++) {
		if (coefficients[0][i] == undefined) {
			return false;
		}
	}
	for (var i = 0; i < coefficients[1].length; i++) {
		if (coefficients[1][i] == undefined) {
			return false;
		}
	}
	return true;
}

// Equation class
function Equation(string) {
	// format initial string
	var sides = string.split(" = ");	// split into left / right
	sides[0] = sides[0].split(" + ");	// split left side
	sides[1] = sides[1].split(" + ");	// split right side


	this.left = new Array(sides[0].length);
	this.right = new Array(sides[1].length);

	// extract all coefficients and symbols from string equation
	extract(this.left, sides[0]);
	extract(this.right, sides[1]);

	// initialize array containing each term found in equation
	this.distinctTerms = [];
	for (var i = 0; i < this.left.length; i++) {
		for (var k = 0; k < this.left[i].keys.length; k++) {
			var symbol = this.left[i].keys[k];
			if (!this.distinctTerms.includes(symbol)) {
				this.distinctTerms.push(symbol);
			}
		}
	}

	// array to store coefficients which will balance equation
	this.coefficients = new Array(2);

	this.coefficients[0] = new Array(this.left.length);		// left side
	this.coefficients[1] = new Array(this.right.length);	// right side

	this.scaleValues = [];		// record of all values coefficients must be multiplied by to eliminate fractions

	this.balance = function() {
		// array of relationships derived from the equation
		var relationships = [];

		for (var term = 0; term < this.distinctTerms.length; term++) {
			relationships[term] = new Relationship();

			var rel = relationships[term];

			for (var i = 0; i < this.left.length; i++) {
				var coeff = this.left[i].get(this.distinctTerms[term]);
				if (coeff != null) {										//	if term exists in this map
					rel.addVariable("left", i, coeff);						//	add new relationship variable to left side, with the index of this term and a coefficient of its subscript
				}
			}

			for (var i = 0; i < this.right.length; i++) {
				var coeff = this.right[i].get(this.distinctTerms[term]);
				if (coeff != null) {										//	if term exists in this map
					rel.addVariable("right", i, coeff);						//	add new relationship variable to right side, with the index of this term and a coefficient of its subscript
				}
			}
		}


		// find a one-to-one relationship and assume one variable is 1
		var one_to_one;
		for (var i = 0; i < relationships.length; i++) {
			// if both are 1
			if (relationships[i].leftTerms.length == 1 && relationships[i].rightTerms.length == 1) {
				one_to_one = relationships[i];
			}
		}

		if (one_to_one == undefined) {
			// no one-to-one relationships found, so unable to substitute 1 and solve
			console.log("Unable to balance");
			return;
		} else {
			// assume 1
			this.coefficients[0][one_to_one.leftTerms[0].index] = 1;
		}


		// while not all coefficients have been found
		while (!checkSolved(this.coefficients)) {

			// for every relationship
			for (var r = 0; r < relationships.length; r++) {

				// try to solve relationship with currently known coefficients
				var sol = relationships[r].solve(this.coefficients);

				if (sol == "solved") {								// if all coefficients found, break
					break;
				} else if (sol != null) {							// if one coefficient found
					this.coefficients[sol[0]][sol[1]] = sol[2];		// update it in coefficients array


					if (!this.scaleValues.includes(sol[3]) && sol[3] != 1) {
						this.scaleValues.push(sol[3]);				
					}
				}
			}
		}


		// calculate overall scale value
		var scale = 1;
		for (var i = 0; i < this.scaleValues.length; i++) {
			scale *= this.scaleValues[i];
		}

		// scale all coefficients
		if (scale != 1) {
			for (var side = 0; side < this.coefficients.length; side++) {
				for (var i = 0; i < this.coefficients[side].length; i++) {
					this.coefficients[side][i] *= scale;
				}
			}
		}

		console.log(this.coefficients[0]);
		console.log(this.coefficients[1]);

		var result = formatWithCoeffs(sides, this.coefficients);

		console.log(result);

	}
}

// class to manage the relationships between the coefficients in the equation
function Relationship() {
	this.leftTerms = [];
	this.rightTerms = [];

	// add a variable to the relationship, given a side, its index in coefficients, and its coefficient (which is the subscript of a term)
	this.addVariable = function(side, index, coeff) {
		if (side == "right") {
			this.rightTerms.push(new RelationshipVariable(index, coeff));
		} else if (side == "left") {
			this.leftTerms.push(new RelationshipVariable(index, coeff));
		}
	}

	// attempt to solve this relationship given all known coefficients
	this.solve = function(coeffs) {
		var unknown;			// the unknown coefficient
		var side = "";			// the side where the unknown coefficient resides
		var numUnknown = 0;		// number of unknown coefficients in this particular relationship; if this exceeds 1, relationship cannot be solved

		// sum of all evaluated values (which are actually coefficients) multiplied by their coefficients for either side
		var leftSum = 0;
		var rightSum = 0;

		// for all terms on left side
		for (var i = 0; i < this.leftTerms.length; i++) {
			var term = this.leftTerms[i];
			term.value = coeffs[0][term.index];

			if (term.value != undefined) {					// if coefficient value is known
				leftSum += term.value * term.coefficient;	// use to calculate sum
			} else {
				numUnknown++;								// otherwise keep track of num unknown
				side = "left";								// and side on which unknown is found
				unknown = term;

				// return if relationship unsolvable with current information
				if (numUnknown > 1) {
					return null;
				}
			}
		}

		// for all terms on right side
		for (var i = 0; i < this.rightTerms.length; i++) {
			var term = this.rightTerms[i];
			term.value = coeffs[1][term.index];

			if (term.value != undefined) {					// if coefficient value is known
				rightSum += term.value * term.coefficient;	// use to calculate sum
			} else {
				numUnknown++;								// otherwise keep track of num unknown
				side = "right";								// and side on which unknown is found
				unknown = term;								

				// return if relationship unsolvable with current information
				if (numUnknown > 1) {
					return null;
				}
			}
		}

		// if already solved
		if (unknown == undefined) {
			return "solved";
		}


		// otherwise return solution in an array format: [side, index in coefficients, value, scale value]
		var sol = [];
		sol[0] = side == "left" ? 0 : 1;																								// "left" is coefficients[0], "right" coefficients[1]
		sol[1] = unknown.index;																											// indicates which coefficient (in coefficients array) is being solved for
		sol[2] = (side == "left" ? rightSum - leftSum : leftSum - rightSum) / unknown.coefficient;										// basic algebra to solve for unknown value
		sol[3] = (side == "left" ? rightSum - leftSum : leftSum - rightSum) % unknown.coefficient != 0 ? unknown.coefficient : 1;		// if fractional result, all coefficients need to be scaled

		return sol;
	}
}

// class to keep track of variables within relationships
// the values for these variables are what we are solving for to balanace the equation. They are the coefficients
function RelationshipVariable(index_, coefficient_) {
	this.index = index_;
	this.coefficient = coefficient_;
	this.value = undefined;				// which is actually the coefficient in the larger equation
}

// essentially a hashmap class, for managing symbols and their original subscripts
function Map() {
	this.keys = [];
	this.values = [];

	// add a key / value pair to map
	this.add = function(key, value) {
		this.keys.push(key);
		this.values.push(value);
	}

	// get value from key
	this.get = function(key) {
		return this.keys.indexOf(key) != -1 ? this.values[this.keys.indexOf(key)] : null;

	}
}