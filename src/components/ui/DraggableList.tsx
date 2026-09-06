import React, { useLayoutEffect, useRef, useState } from 'react';
import { View, Animated, PanResponder, GestureResponderHandlers } from 'react-native';

interface Props<T> {
    data: T[];
    keyExtractor: (item: T) => string;
    /** Les poignees recues doivent etre posees sur la zone de saisie du rendu. */
    renderItem: (item: T, index: number, dragHandlers: GestureResponderHandlers, isActive: boolean) => React.ReactNode;
    onReorder: (from: number, to: number) => void;
    onDragStateChange?: (isDragging: boolean) => void;
}

const SETTLE_DURATION_MS = 160;

/**
 * Liste reordonnable par glisser-deposer, utilisable dans un ScrollView existant.
 * S'appuie sur PanResponder/Animated du coeur de React Native (aucune dependance).
 *
 * Chaque carte possede sa propre valeur animee persistante, indexee par identifiant :
 * le decalage est pilote de facon imperative, sans aucun rendu pendant le geste.
 */
export function DraggableList<T>({
    data, keyExtractor, renderItem, onReorder, onDragStateChange,
}: Props<T>) {
    const offsets = useRef(new Map<string, Animated.Value>()).current;
    const heights = useRef(new Map<string, number>()).current;
    const handlersCache = useRef(new Map<number, GestureResponderHandlers>()).current;
    const keysRef = useRef<string[]>([]);
    const fromRef = useRef<number | null>(null);
    const targetRef = useRef<number | null>(null);
    const pendingSettle = useRef<{ key: string; offset: number } | null>(null);
    const [activeKey, setActiveKey] = useState<string | null>(null);

    keysRef.current = data.map(keyExtractor);

    function offsetOf(key: string): Animated.Value {
        let value = offsets.get(key);
        if (!value) {
            value = new Animated.Value(0);
            offsets.set(key, value);
        }
        return value;
    }

    const heightAt = (index: number) => heights.get(keysRef.current[index]) ?? 0;

    // Index d'insertion : on franchit un voisin des que la moitie de sa hauteur est depassee
    function computeTarget(from: number, dy: number): number {
        let target = from;
        let acc = 0;
        if (dy > 0) {
            for (let i = from + 1; i < keysRef.current.length; i++) {
                const h = heightAt(i);
                if (dy > acc + h / 2) { target = i; acc += h; } else break;
            }
        } else if (dy < 0) {
            for (let i = from - 1; i >= 0; i--) {
                const h = heightAt(i);
                if (-dy > acc + h / 2) { target = i; acc += h; } else break;
            }
        }
        return target;
    }

    /** Ecarte les voisins pour liberer la place, sans repasser par un rendu. */
    function applyShifts(from: number, target: number) {
        const dragged = heightAt(from);
        keysRef.current.forEach((key, i) => {
            if (i === from) return;
            let shift = 0;
            if (target > from && i > from && i <= target) shift = -dragged;
            else if (target < from && i >= target && i < from) shift = dragged;
            offsetOf(key).setValue(shift);
        });
    }

    function resetShifts(exceptKey: string) {
        keysRef.current.forEach((key) => {
            if (key !== exceptKey) offsetOf(key).setValue(0);
        });
    }

    // Les decalages ne sont neutralisés qu'une fois le nouvel ordre valide : applique
    // avant, l'ancien agencement reapparaitrait le temps d'une trame.
    // useLayoutEffect s'execute avant l'affichage, l'etat intermediaire reste invisible.
    useLayoutEffect(() => {
        const pending = pendingSettle.current;
        if (!pending) return;
        pendingSettle.current = null;

        resetShifts(pending.key);
        offsetOf(pending.key).setValue(pending.offset);

        Animated.timing(offsetOf(pending.key), {
            toValue: 0,
            duration: SETTLE_DURATION_MS,
            useNativeDriver: false,
        }).start(() => setActiveKey(null));
    });

    function finishDrag(dy: number) {
        const from = fromRef.current;
        const target = targetRef.current;
        fromRef.current = null;
        targetRef.current = null;
        onDragStateChange?.(false);

        if (from === null || target === null) return;

        const key = keysRef.current[from];

        if (target === from) {
            resetShifts(key);
            Animated.timing(offsetOf(key), {
                toValue: 0,
                duration: SETTLE_DURATION_MS,
                useNativeDriver: false,
            }).start(() => setActiveKey(null));
            return;
        }

        // Distance dont la case de la carte se deplace dans la liste reordonnee
        let delta = 0;
        if (target > from) {
            for (let i = from + 1; i <= target; i++) delta += heightAt(i);
        } else {
            for (let i = target; i < from; i++) delta -= heightAt(i);
        }

        // La carte reste sous le doigt : le reliquat n'est pose qu'apres reordonnancement.
        pendingSettle.current = { key, offset: dy - delta };
        onReorder(from, target);
    }

    // Mis en cache : un PanResponder recree en cours de geste perdrait le suivi de dy.
    function getHandlers(index: number): GestureResponderHandlers {
        const cached = handlersCache.get(index);
        if (cached) return cached;

        const handlers = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                fromRef.current = index;
                targetRef.current = index;
                offsetOf(keysRef.current[index]).setValue(0);
                setActiveKey(keysRef.current[index]);
                onDragStateChange?.(true);
            },
            onPanResponderMove: (_evt, gesture) => {
                const from = fromRef.current;
                if (from === null) return;
                offsetOf(keysRef.current[from]).setValue(gesture.dy);

                const target = computeTarget(from, gesture.dy);
                if (target !== targetRef.current) {
                    targetRef.current = target;
                    applyShifts(from, target);
                }
            },
            onPanResponderRelease: (_evt, gesture) => finishDrag(gesture.dy),
            onPanResponderTerminate: (_evt, gesture) => finishDrag(gesture.dy),
        }).panHandlers;

        handlersCache.set(index, handlers);
        return handlers;
    }

    return (
        <View>
            {data.map((item, index) => {
                const key = keyExtractor(item);
                const isActive = key === activeKey;
                return (
                    <Animated.View
                        key={key}
                        onLayout={(e) => { heights.set(key, e.nativeEvent.layout.height); }}
                        style={{
                            transform: [{ translateY: offsetOf(key) }],
                            zIndex: isActive ? 10 : 0,
                            elevation: isActive ? 10 : 0,
                        }}
                    >
                        {renderItem(item, index, getHandlers(index), isActive)}
                    </Animated.View>
                );
            })}
        </View>
    );
}
