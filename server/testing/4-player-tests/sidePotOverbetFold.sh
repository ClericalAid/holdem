#!/bin/bash

# Distribute some chips around
sleep 10 > myPipe &
sleep 1
echo "raise 50" > myPipe; sleep 0.1
echo "raise 100" > myPipe; sleep 0.1
echo "shove" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1

# Somebody will bet above a side pot amount, then fold.
echo "board" > myPipe; sleep 0.1

echo "new" > myPipe; sleep 0.1
echo "shove" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1

echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "raise 20" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "shove" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "board" > myPipe; sleep 0.1
