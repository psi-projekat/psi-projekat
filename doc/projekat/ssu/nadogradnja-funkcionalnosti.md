# 1. Увод

## 1.1. Резиме

Спецификација сценарија случаја употребе "надоградња функционалности".

## 1.2. Намена документа и циљне групе

Документ се може користити у фазама

1. Имплементације
2. Тестирања
3. Писања корисничких упутстава

## 1.3. Референце

Упутство за писање спецификација сценарија случаја употребе.

## 1.4. Отворена питања

Нема.

# 2. Сценарио надоградње функционалности

## 2.1. Кратак опис

Након завршеног такмичења, сви учесници добијају одређен број бодова сразмерно успеху који су остварили на такмичењу. За те бодове могу "купити" одређене функционалности које им иницијално нису биле доступне. Те функционалности могуће је употребити на наредном такмичењу у циљу остваривања бољег успеха.

## 2.2. Ток догађаја

### 2.2.1. Успешна надоградња

1. Пријављени корисник кликне на дугме "Профил" из главног навигационог менија.
2. Ту може видети колико бодова тренутно има. Затим кликне на дугме "Надоградња".
3. Отвара се листа свих функционалности. Оне за које нема довољно бодова не може ни да изабере.
4. Корисник кликне на једну од функционалности.
5. Приказује се порука о успешној надоградњи и бодови се умањују за вредност те функционалности.
6. Након затварања поруке, корисник остаје на страници "Надоградња".

## 2.3. Посебни захтеви

Нема.

## 2.4. Предуслови

Корисник мора бити пријављен на систем и мора имати бар онолико бодова колико је потребно за куповину најјефтиније функционалности.

## 2.5. Последице

Промена се бележи у бази података.