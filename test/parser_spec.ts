import {expect} from "chai";
import {string, choice, or} from "../src/Parser.ts";
import {Suggestion} from "../src/plugins/autocompletion_providers/Suggestions";

const context = {
    directory: "/",
};
const valuesOf = (suggestions: Suggestion[]) => suggestions.map(suggestion => suggestion.value);

describe("parser", () => {
    it("returns suggestions", async() => {
        const result = await string("git")
            .bind(string(" "))
            .bind(choice([string("commit"), string("checkout"), string("merge")]))
            .parse("git c", context);
        const suggestions = await result.parser.suggestions(context);

        expect(valuesOf(suggestions)).to.eql(["commit", "checkout"]);
    });

    describe("string", () => {
        it("fails when only beginnings match", async() => {
            const result = await string("grep").parse("git c", context);

            expect(result.parser.isValid).to.eql(false);
        });
    });

    describe("or", () => {
        it("chooses the left parser if the right one doesn't match", async() => {
            const result = await or(string("foo"), string("bar")).parse("f", context);
            const suggestions = await result.parser.suggestions(context);

            expect(valuesOf(suggestions)).to.eql(["foo"]);
        });

        it("chooses the right parser if the left one doesn't match", async() => {
            const result = await or(string("foo"), string("bar")).parse("b", context);
            const suggestions = await result.parser.suggestions(context);

            expect(valuesOf(suggestions)).to.eql(["bar"]);
        });

        it("keeps both parsers if they match", async() => {
            const result = await or(string("soon"), string("sooner")).parse("soo", context);
            const suggestions = await result.parser.suggestions(context);

            expect(valuesOf(suggestions)).to.eql(["soon", "sooner"]);
        });

        it("doesn't commit to a branch too early", async() => {
            const result = await string("git")
                .bind(or(string(" "), string("  ")))
                .bind(string("commit"))
                .parse("git  commit", context);

            expect(result.parser.isValid).to.eql(true);
        });
    });
});
