# LÉXICO

Este projeto foi desenvolvido como um jogo simples e divertido, onde dois jogadores competem para levar o adversário a cometer um erro. A competição consiste em tentar fazer com que o oponente digite uma palavra ou escreva um prefixo inválido (ou seja, uma sequência que **não seja** o início de uma palavra válida).

## Verificação de Palavras e Prefixos

Para validar as palavras e os prefixos, foi utilizada a [API Dicionário Aberto](https://api.dicionario-aberto.net/index.html). Essa API permite confirmar se uma determinada sequência de caracteres constitui o início de uma palavra. 

Além da API, foram utilizados alguns prefixos selecionados manualmente. Essa seleção foi feita com o intuito de balancear o jogo e para também validar palavras com menos de três letras, pois a API não cobre esse caso.

## Considerações Finais

Este projeto tem a finalidade de entreter e testar o conhecimento dos jogadores sobre a estrutura das palavras. Sinta-se à vontade para contribuir e sugerir melhorias!

## English Version

This project was developed as a simple and fun game where two players compete to force their opponent into making a mistake. The objective is to have the opposing player either type a complete word or enter an invalid prefix (that is, a sequence that **is not** the beginning of any valid word).

### Word and Prefix Verification

To validate words and prefixes, the game uses the [Open Dictionary API](https://api.dicionario-aberto.net/index.html), which confirms whether a given sequence of characters is the beginning of a valid word.

In addition to the API, some manually selected prefixes were implemented to balance the game and handle words with less than three letters, which the API does not cover.

### Final Considerations

This project is designed to entertain while challenging players' knowledge of word structures. Contributions and suggestions for improvements are very welcome!
