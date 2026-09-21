package moresort

import "sort"

func Levenshtein(a, b string) int {
	ar := []rune(a)
	br := []rune(b)

	// dp[i][j] = Distanz zwischen ar[:i] und br[:j]
	dp := make([][]int, len(ar)+1)

	for i := range dp {
		dp[i] = make([]int, len(br)+1)
	}

	// Randwerte
	for i := 0; i <= len(ar); i++ {
		dp[i][0] = i
	}

	for j := 0; j <= len(br); j++ {
		dp[0][j] = j
	}

	// Tabelle berechnen
	for i := 1; i <= len(ar); i++ {
		for j := 1; j <= len(br); j++ {
			cost := 0
			if ar[i-1] != br[j-1] {
				cost = 1
			}

			dp[i][j] = min(
				dp[i-1][j]+1,      // Löschen
				dp[i][j-1]+1,      // Einfügen
				dp[i-1][j-1]+cost, // Ersetzen
			)
		}
	}

	return dp[len(ar)][len(br)]
}

func SortBySimilarity(items []string, target string) []string {
	result := append([]string(nil), items...)

	sort.SliceStable(result, func(i, j int) bool {
		return Levenshtein(result[i], target) < Levenshtein(result[j], target)
	})

	return result
}
