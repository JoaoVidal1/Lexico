# LÉXICO

Este projeto foi desenvolvido como um jogo simples e divertido, onde dois jogadores competem para levar o adversário a cometer um erro. A competição consiste em tentar fazer com que o oponente digite uma palavra ou escreva um prefixo inválido (ou seja, uma sequência que **não seja** o início de uma palavra válida).

## Verificação de Palavras e Prefixos

Para validar as palavras e os prefixos, foi utilizada a [API Dicionáriio Aberto](https://api.dicionario-aberto.net/index.html). Essa API permite confirmar se uma determinada sequência de caracteres constitui o início de uma palavra. 

Além da API, foram utilizados alguns prefixos selecionados manualmente. Essa seleção foi feita com o intuito de balancear o jogo e para também validar palavras com menos de três letras, pois a API não cobre esse caso.

## Considerações Finais

Este projeto tem a finalidade de entreter e testar o conhecimento dos jogadores sobre a estrutura das palavras. Sinta-se à vontade para contribuir e sugerir melhorias!
