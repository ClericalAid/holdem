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
echo "board" > myPipe; sleep 0.1

# Create a side pot, then somebody bluffs out everyone else
echo "new" > myPipe; sleep 0.1
echo "shove" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "raise 10" > myPipe; sleep 0.1
echo "raise 30" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "raise 40" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1

echo "board" > myPipe; sleep 0.1
