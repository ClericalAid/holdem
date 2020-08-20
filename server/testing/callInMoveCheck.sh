#!/bin/bash

# Distribute some chips around
sleep 5 > myPipe &
sleep 1
echo "raise 50" > myPipe; sleep 0.1
echo "raise 100" > myPipe; sleep 0.1
echo "shove" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1

# Perform a call in and check everybody's valid moves
echo "new" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "raise 70" > myPipe; sleep 0.1
echo "shove" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "board" > myPipe; sleep 0.1
echo "moves" > myPipe; sleep 0.1
