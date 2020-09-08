#!/bin/bash

# 3 Bet, then go into next round and check valid moves. Maybe try it again, who knows
sleep 5 > myPipe &
sleep 1
echo "raise 5" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "raise 10" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "board" > myPipe; sleep 0.1
echo "moves" > myPipe; sleep 0.1
